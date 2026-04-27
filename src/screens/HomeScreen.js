import React, { useState, useRef } from "react";
import type { Node } from "react";
import { Alert, Linking, TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView, AppState, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { MenuView } from "@react-native-menu/menu";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Animated } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import FastImage from "react-native-fast-image";
import RNFS from "react-native-fs";

import { keys, errors } from "../Constants";
import { useEpilogueStyle } from '../hooks/useEpilogueStyle';
import epilogueStorage from "../Storage";
import { Icon } from "../Icon";
import { Book } from "../models/Book";

const latestBooksCachePath = RNFS.CachesDirectoryPath + "/LatestBooks.json";

function BookSwipeableRow({ bookID, children, onRemove, styles }) {
	const swipeableRef = useRef(null);

	const renderRightActions = (progress) => {
		const actionOpacity = progress.interpolate({
			inputRange: [0, 0.2, 0.85, 1],
			outputRange: [0, 0, 1, 1],
			extrapolate: "clamp",
		});

		return (
			<View style={styles.removeContainer}>
				<RectButton style={styles.removeAction} onPress={() => {
					swipeableRef.current?.close?.();
					onRemove(bookID);
				}}>
					<Animated.View style={{ opacity: actionOpacity }}>
						<View style={styles.removeCircle}>
							<Icon name="trash" color="#FFFFFF" size={18} />
						</View>
					</Animated.View>
				</RectButton>
			</View>
		);
	};

	return (
		<Swipeable
			enableTrackpadTwoFingerGesture={true}
			friction={1}
			overshootFriction={8}
			overshootRight={false}
			ref={swipeableRef}
			renderRightActions={renderRightActions}
			rightThreshold={40}
		>
			{children}
		</Swipeable>
	);
}

export function HomeScreen({ navigation }) {
	const styles = useEpilogueStyle()
	const colorScheme = useColorScheme();
	const is_dark = (colorScheme == "dark");
	const [ books, setBooks ] = useState();
	const [ latestBooks, setLatestBooks ] = useState([]);
	const [ bookshelves, setBookshelves ] = useState([]);
	const [ currentBookshelfTitle, setCurrentBookshelfTitle ] = useState();
	const [ isSearching, setIsSearching ] = useState(false);
	const searchFieldRef = useRef();
    
	React.useEffect(() => {
		const unsubscribe_focus = navigation.addListener("focus", () => {
			onFocus(navigation);
		});

		const unsubscribe_change = AppState.addEventListener("change", nextAppState => {
			if (nextAppState == "active") {
				onBecomeActive();
			}
		});

		return () => {
			unsubscribe_focus();
			unsubscribe_change.remove();
		};
	}, [navigation]);

	React.useEffect(() => {
		if (currentBookshelfTitle && bookshelves.length > 0) {
			setupBookshelves(navigation, bookshelves, currentBookshelfTitle);
		}
	}, [is_dark, currentBookshelfTitle, bookshelves, navigation]);

	React.useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				isSearching ? (
					<View style={{ marginRight: 24 }}>
						<ActivityIndicator size="small" color={is_dark ? "#FFFFFF" : "#000000"} />
					</View>
				) : null
			)
		});
	}, [navigation, isSearching, is_dark]);
  
	function onFocus(navigation) {
		if (currentBookshelfTitle && bookshelves.length > 0) {
			setupBookshelves(navigation, bookshelves, currentBookshelfTitle);
		}
		else {
			epilogueStorage.get(keys.allBookshelves).then(saved_bookshelves => {
				epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
					if (saved_bookshelves && saved_bookshelves.length > 0 && current_bookshelf) {
						setBookshelves(saved_bookshelves);
						setCurrentBookshelfTitle(current_bookshelf.title);
						setupBookshelves(navigation, saved_bookshelves, current_bookshelf.title);
					}
				});
			});
		}
		
		epilogueStorage.get(keys.authToken).then(auth_token => {
			if ((auth_token == null) || (auth_token.length == 0)) {
				navigation.navigate("SignIn");
			}
			else {
				// if nothing set yet, verify token and load books
				epilogueStorage.get(keys.currentBlogID).then(blog_id => {
					if ((blog_id == null) || (blog_id.length == 0)) {
						verifyToken(auth_token);
					}
					else {
						// no search yet, load bookshelves
						epilogueStorage.get(keys.currentSearch).then(current_search => {
							if ((current_search == null) || (current_search.length == 0)) {
								searchFieldRef.current.clear();
								loadBookshelves(navigation);
							}
						});
					}
				});
			}
		});
		
		const linking_sub = setupLinking();
		setupProfileIcon();
		
		// cleanup
		return () => {
			unsubscribe_focus();
			unsubscribe_change.remove();
			if (linking_sub && (typeof linking_sub.remove == "function")) {
				linking_sub.remove();
			}
		};
	}
	
	function onBecomeActive() {
		epilogueStorage.get(keys.authToken).then(auth_token => {
			if ((auth_token != null) && (auth_token.length > 0)) {
				// no search yet, load bookshelves
				epilogueStorage.get(keys.currentSearch).then(current_search => {
					if ((current_search == null) || (current_search.length == 0)) {
						searchFieldRef.current.clear();
						loadBookshelves(navigation);
					}
				});
			}
		});
	}
  
	function setupLinking() {
		Linking.getInitialURL().then(url => {
			loadURL(url);
		});
		
		// returns EventSubscription in modern RN
		return Linking.addEventListener("url", (event) => {
			const u = event && event.url ? event.url : undefined;
			loadURL(u);
		});
	}
  
	function loadURL(url) {
		if (url != undefined) {
			if (url.includes("/signin")) {
				let pieces = url.split("/");
				let temp_token = pieces[pieces.length - 1];
				verifyToken(temp_token);
			}
			else if (url.includes("/indieauth")) {
				var args = {};
				var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
					args[key] = value;
				});
				redeemAuthCode(args["code"], args["state"]);
			}
		}
	}

	function redeemAuthCode(code, state) {
		epilogueStorage.get(keys.authState).then(saved_state => {
			// check that state matches
			if (saved_state != state) {
				Alert.alert(errors.stateDoesNotMatch);
				return;
			}
			
			// exchange authorization code for new access token
			epilogueStorage.get(keys.tokenURL).then(token_url => {
				let form = new FormData();
				form.append("grant_type", "authorization_code");
				form.append("code", code);
				form.append("client_id", "https://epilogue.micro.blog/");
				form.append("redirect_uri", "https://epilogue.micro.blog/indieauth/");
				
				var options = {
					method: "POST",
					body: form
				};
												
				fetch(token_url, options).then(response => response.json()).then(data => {
					epilogueStorage.set(keys.micropubToken, data.access_token);
				});
			});
		});
	}
	
	function verifyToken(token) {		
		let form = new FormData();
		form.append("token", token);
		
		var options = {
			method: "POST",
			body: form
		};
		
		fetch("https://micro.blog/account/verify", options).then(response => response.json()).then(data => {
			if (data.error) {
				Alert.alert("Error signing in", data.error);
			}
			else {
				let username = data.username;
				let new_token = data.token;
				let blog_name = data.default_site;
	
				// if no pref for blog, load blogs and set default
				epilogueStorage.get(keys.currentBlogID).then(blog_id => {
					if ((blog_id == null) || (blog_id.length == 0)) {
						loadBlogs();
					}
				});
			
				// save token and load books
				epilogueStorage.set(keys.authToken, new_token).then(() => {
					loadBookshelves(navigation);

					// close sign-in screen if it was open
					navigation.goBack();				
				});

				// save current username
				epilogueStorage.set(keys.currentUsername, username).then(() => {
					setupProfileIcon();
				});
			}
		});
	}
  
  	function loadBlogs() {
		epilogueStorage.get(keys.authToken).then(auth_token => {
			var use_token = auth_token;
			epilogueStorage.get(keys.micropubToken).then(micropub_token => {
				if (micropub_token != undefined) {
					use_token = micropub_token;
				}

				var options = {
					headers: {
						"Authorization": "Bearer " + use_token
					}
				};

				epilogueStorage.get(keys.micropubURL).then(micropub_url => {
					var use_url = micropub_url;
					if (use_url == undefined) {
						use_url = "https://micro.blog/micropub";
					}
					
					if (use_url.includes("?")) {
						use_url = use_url + "&q=config";
					}
					else {
						use_url = use_url + "?q=config";
					}
					
					fetch(use_url, options).then(response => response.json()).then(data => {
						var blog_id = "";
						var blog_name = "";
						
						if (data.destination.length > 0) {
							blog_id = data.destination[0].uid;
							blog_name = data.destination[0].name;
							
							for (let blog of data.destination) {								
								if (blog["microblog-default"] == true) {
									blog_id = blog.uid;
									blog_name = blog.name;								
								}
							}
						}

						epilogueStorage.set(keys.currentBlogID, blog_id);
						epilogueStorage.set(keys.currentBlogName, blog_name);
					});
				});
			});
		});
	}
  
	function loadBooks(bookshelf_id, handler = function() {}) {
		if (bookshelf_id == undefined) {
			return;
		}
		
		epilogueStorage.get(keys.authToken).then(auth_token => {
			var options = {
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
						
			fetch("https://micro.blog/books/bookshelves/" + bookshelf_id, options).then(response => response.json()).then(data => {
				const new_books = booksFromJSONFeed(data);
				setBooks(new_books);
				setLatestBooks(new_books);
				writeLatestBooksCache(data);
				handler();
			});		
		});
	}

	function loadCachedBooks() {
		RNFS.readFile(latestBooksCachePath, "utf8").then(contents => {
			const new_books = booksFromJSONFeed(JSON.parse(contents));
			setBooks(new_books);
			setLatestBooks(new_books);
		}).catch(() => {
			epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
				if (current_bookshelf != null) {
					loadBooks(current_bookshelf.id);
				}
			});
		});
	}

	function writeLatestBooksCache(data) {
		RNFS.writeFile(latestBooksCachePath, JSON.stringify(data), "utf8").catch(() => {
		});
	}

	function booksFromJSONFeed(data) {
		var new_items = [];
		for (let item of data.items || []) {
			const metadata = item._microblog || {};
			var author_name = "";
			if ((item.authors != undefined) && (item.authors.length > 0)) {
				author_name = item.authors[0].name;
			}
			new_items.push({
				id: item.id,
				isbn: metadata.isbn,
				title: item.title,
				image: item.image,
				author: author_name,
				description: item.content_text,
				date: item.date_published,
				is_search: false
			});
		}
		return new_items;
	}
  
	function loadBookshelves(navigation) {
		epilogueStorage.get(keys.authToken).then(auth_token => {
			var options = {
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};

			fetch("https://micro.blog/books/bookshelves", options).then(response => response.json()).then(data => {
				var new_items = [];
				for (let item of data.items) {
					var s;
					if (item._microblog.books_count == 1) {
						s = "1 book";
					}
					else {
						s = item._microblog.books_count + " books";
					}
					
					new_items.push({
						id: item.id.toString(),
						title: item.title,
						books_count: s,
						type: item._microblog.type
					});
				}
				
				setBookshelves(new_items);
				epilogueStorage.set(keys.allBookshelves, new_items);
				
				epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
					if (current_bookshelf == null) {
						let first_bookshelf = new_items[0];
						epilogueStorage.set(keys.currentBookshelf, first_bookshelf).then(() => {
							loadBooks(first_bookshelf.id);
							setCurrentBookshelfTitle(first_bookshelf.title);
							setupBookshelves(navigation, new_items, first_bookshelf.title);
						});
					}
					else {
						loadBooks(current_bookshelf.id);
						setCurrentBookshelfTitle(current_bookshelf.title);
						setupBookshelves(navigation, new_items, current_bookshelf.title);
					}
				});
			});		
		});
	}

	function setupBookshelves(navigation, items, currentTitle) {
		navigation.setOptions({
			headerTitle: () => (
				<MenuView accessibilityLabel={currentTitle}
				onPressAction = {({ nativeEvent }) => {
					let shelf_id = nativeEvent.event;
					loadBooks(shelf_id, function() {
						epilogueStorage.get(keys.allBookshelves).then(bookshelves => {
							for (let shelf of bookshelves) {
								if (shelf.id == shelf_id) {
									epilogueStorage.set(keys.currentBookshelf, shelf);
									setCurrentBookshelfTitle(shelf.title);
									setupBookshelves(navigation, bookshelves, shelf.title);
								}
							}
						});
					});
				}}
				actions = {items}
				>
					<View style={styles.navbarBookshelf}>
						<Text style={[ styles.navbarBookshelfTitle, { marginLeft: Platform.OS == "ios" ? 15 : 0, color: is_dark ? "#FFFFFF" : "#000000" } ]}>{currentTitle}</Text>
						<Icon name="popup-triangle" color={is_dark ? "#FFFFFF" : "#000000"} size={10} style={styles.navbarBookshelfTriangle} />
					</View>
				</MenuView>
			)
		});
	}
	
	function setupProfileIcon() {
		epilogueStorage.get(keys.currentUsername).then(username => {
			let avatar_url = "https://micro.blog/" + username + "/avatar.jpg";
			navigation.setOptions({
				headerLeft: () => (
					<Pressable onPress={() => { onShowProfile(); }} accessibilityRole="button" accessibilityLabel="show profile">
						<Image style={styles.profileIcon} source={{ uri: avatar_url }} />
					</Pressable>
				)
			});		
		});
	}	
	
	function onShowProfile() {
		navigation.navigate("Profile");
	}

	function searchResultItems(new_books, searchText, local_books = []) {
		var new_items = [];

		for (let b of local_books) {
			new_items.push(b);
		}

		for (let b of new_books) {
			if (local_books.some(local_book => local_book.isbn == b.isbn || local_book.id == b.id)) {
				continue;
			}

			new_items.push({
				id: b.id,
				isbn: b.isbn,
				title: b.title,
				image: b.cover_url,
				author: b.author,
				description: b.description,
				date: "",
				is_search: true
			});
		}

		if (new_items.length == 0) {
			new_items.push({
				id: "new-book",
				is_new_book_row: true,
				searchText: searchText
			});
		}

		return new_items;
	}

	function localBookshelfMatches(searchText) {
		const query = searchText.trim().toLowerCase();
		if (query.length == 0) {
			return [];
		}

		return latestBooks.filter(book => {
			const book_title = (book.title || "").toLowerCase();
			const book_author = (book.author || "").toLowerCase();
			return book_title.includes(query) || book_author.includes(query);
		}).map(book => ({
			...book,
			is_bookshelf_match: true,
			bookshelf_name: currentBookshelfTitle
		}));
	}
		
	function sendSearch(searchText) {
		setIsSearching(true);
		const local_books = localBookshelfMatches(searchText);

		if (Book.isISBN(searchText)) {
			Book.searchOpenLibrary(searchText, function(new_books) {
				if (new_books.length > 0) {				
					setBooks(searchResultItems(new_books, searchText, local_books));
					setIsSearching(false);
				}
				else {
					Book.searchMicroBooks(searchText, function(new_books) {
						setBooks(searchResultItems(new_books, searchText, local_books));
						setIsSearching(false);
					});
				}
				
			});
		}
		else {		
			Book.searchMicroBooks(searchText, function(new_books) {
				setBooks(searchResultItems(new_books, searchText, local_books));
				setIsSearching(false);
			});
		}
	}

	function onAddBookInfoPressed(searchText) {
		epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
			if (current_bookshelf == null) {
				return;
			}

			const params = {
				bookshelf_id: current_bookshelf.id,
				bookshelf_title: current_bookshelf.title,
				isbn: Book.isISBN(searchText) ? searchText : ""
			};
			navigation.navigate("AddBookInfo", params);
		});
	}
	
	function onShowBookPressed(item) {
		epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
			var params = {
				id: item.id,
				isbn: item.isbn,
				title: item.title,
				image: item.image,
				author: item.author,
				description: item.description,
				date: item.date,
				bookshelves: bookshelves,
				current_bookshelf: current_bookshelf,
				is_search: item.is_search
			};
			navigation.navigate("Details", params);
		});
	}
  
	function removeFromBookshelf(bookID) {
		epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
			epilogueStorage.get("auth_token").then(auth_token => {
				var options = {
					method: "DELETE",
					headers: {
						"Authorization": "Bearer " + auth_token
					}
				};

				let url = "https://micro.blog/books/bookshelves/" + current_bookshelf.id + "/remove/" + bookID;						
				fetch(url, options).then(response => response.json()).then(data => {
					loadBooks(current_bookshelf.id);
				});
			});
		});
	}

	function onChangeSearch(text) {		
		if (text.length == 0) {
			epilogueStorage.remove(keys.currentSearch).then(() => {
				loadCachedBooks();
			});
		}
		else {
			epilogueStorage.set(keys.currentSearch, text);
		}
	}

	function onRunSearch() {
		epilogueStorage.get(keys.currentSearch).then(search_text => {
			let s = String(search_text);
			if ((s != "null") && (s.length > 0)) {
				sendSearch(s);
			}
			else {
				epilogueStorage.remove(keys.currentSearch).then(() => {
					loadCachedBooks();
				});
			}
		});
	}

	return (
		<View style={styles.container}>
			<TextInput style={styles.searchField} onChangeText={onChangeSearch} onEndEditing={onRunSearch} returnKeyType="search" placeholder="Search for books to add" placeholderTextColor="#6d6d72" clearButtonMode="always" ref={searchFieldRef} />
			<FlatList
				data = {books}
				renderItem = { ({item}) => 
				item.is_new_book_row ? (
					<View style={styles.bookSearchEmptyRow}>
						<Text style={styles.bookSearchEmptyText}>Can't find a book? Try searching for its ISBN or add a new book.</Text>
						<Pressable style={styles.micropubButton} onPress={() => { onAddBookInfoPressed(item.searchText); }}>
							<Text style={styles.micropubButtonTitle}>New Book</Text>
						</Pressable>
					</View>
				) : (
				<BookSwipeableRow bookID={item.id} onRemove={removeFromBookshelf} styles={styles}>
					<Pressable onPress={() => {
						onShowBookPressed(item);
					}}>
						<View style={styles.item}>
							<FastImage style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
							<View style={styles.bookItem}>
								<Text style={styles.bookTitle} ellipsizeMode="tail" numberOfLines={2}>{item.title}</Text>
								<Text style={styles.bookAuthor}>{item.author}</Text>
								{ item.is_bookshelf_match &&
									<Text style={styles.bookSecondary}>📚 {item.bookshelf_name}</Text>
								}
							</View>
						</View>
					</Pressable>
				</BookSwipeableRow>
				)
				}
				keyExtractor = { item => item.id }
			/>
		</View>
	);
}
