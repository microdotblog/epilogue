
import React, { useState } from "react";
import { TextInput, Pressable, FlatList, Image, View, TouchableOpacity, Text, RefreshControl, ActivityIndicator, Platform, Share, StyleSheet, useColorScheme } from 'react-native';
import { useScrollToTop } from "@react-navigation/native";
import Clipboard from '@react-native-clipboard/clipboard';
import { InAppBrowser } from 'react-native-inappbrowser-reborn'
import FastImage from "react-native-fast-image";

import { ContextMenu } from "../ContextMenu";
import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Book } from "../models/Book";
import { useProfileHeader } from "../ProfileHeaderButton";
import { booksFromJSONFeed, readBookshelfIDsContainingBook, refreshAllBookshelfCachesInBackground } from "../BookshelfCache";

const discoverSources = [
	{ id: "microblog", label: "Recently blogged on Micro.blog", icon: require("../../images/mb.png"), url: "https://micro.blog/posts/discover/books" },
	{ id: "nyt", label: "New York Times bestsellers", icon: require("../../images/nyt.png"), url: "https://micro.blog/posts/discover/books/bestsellers" }
];

export function DiscoverScreen({ navigation }) {		
	const styles = useEpilogueStyle();
	const dark = useColorScheme() === "dark";
	useProfileHeader(navigation, styles);
	const iosMajorVersion = Number.parseInt(String(Platform.Version).split(".")[0], 10);
	const shouldShowTabBacking = Platform.OS === "ios" && iosMajorVersion == 26;
	
	const [ data, setData ] = useState()
	const [ refreshing , setRefreshing ] = useState(false)
	const [ loaded, setLoaded ] = useState(false)
	const [ searching, setSearching ] = useState(false)
	const [ columns, setColumns ] = useState(1)
	const [ menuActions, setMenuActions] = useState([])	
	const [ books, setBooks ] = useState()
	const [ itemUpdating, setItemUpdating ] = useState('')
	const [source, setSource] = useState("microblog");
	const [loadError, setLoadError] = useState(null);
	const sourceRef = React.useRef("microblog");
	const feedRequestRef = React.useRef(0);
	const discoverListRef = React.useRef(null);

	useScrollToTop(discoverListRef);

	React.useEffect(() => {
		const selector = (
			<View style={[sourceStyles.control, { backgroundColor: dark ? "#34343A" : "#E9E9EB" }]}>
				{discoverSources.map(item => (
					<Pressable key={item.id} testID={`discover-source-${item.id}`} accessibilityRole="button"
						hitSlop={{ top: 6, bottom: 6 }}
						accessibilityLabel={item.label} accessibilityState={{ selected: source === item.id }}
						onPress={() => selectSource(item.id)} style={[sourceStyles.segment,
							source === item.id && { backgroundColor: dark ? "#636366" : "white" }]}>
						<Image source={item.icon} style={sourceStyles.icon} />
					</Pressable>
				))}
			</View>
		);
		const headerTitle = source === "nyt" ? "NYT Best Sellers" : "Recently Blogged";
		navigation.setOptions(Platform.OS === "ios" ? {
			headerTitle,
			unstable_headerRightItems: () => [{ type: "custom", element: selector, hidesSharedBackground: true }]
		} : { headerTitle, headerRight: () => selector });
	}, [navigation, source, dark]);

	React.useEffect(() => () => { feedRequestRef.current += 1; }, []);

	function selectSource(nextSource) {
		if (sourceRef.current === nextSource) return;
		sourceRef.current = nextSource;
		setSource(nextSource);
		setSearching(false);
		setLoaded(false);
		setData([]);
		setRefreshing(false);
		loadBooks();
	}
			
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	const onFocus = (navigation) =>  {
		loadBooks();
		epilogueStorage.get(keys.allBookshelves).then(bookshelves => {			
			var root_items;
			if (Platform.OS === "ios") {
				var shelf_items = [];
				for (var item of bookshelves) {
					if (item.type != "loans" && item.type != "holds") {
						shelf_items.push({
							id: item.id,
							title: item.title
						});
					}
					
				}

				root_items = [
					{
						id: 'share',
						title: 'Share',
						systemIcon: 'square.and.arrow.up'
					},
					{
						id: 'bookshelves',
						title: 'Bookshelves',
						inlineChildren: true,
						actions: shelf_items
					}
				]
			}
			else {			
				root_items = [
					{
						id: 'share',
						title: 'Share'
					}
				]
				
				for (var item of bookshelves) {
					if (item.type != "loans" && item.type != "holds") {
						root_items.push({
							id: item.id,
							title: item.title
						});
					}
				}				
			}
			
			setMenuActions(root_items)
		});
	}
	async function loadBooks() {
		const requestID = ++feedRequestRef.current;
		setLoadError(null);
		try {
			const endpoint = discoverSources.find(item => item.id === sourceRef.current).url;
			const response = await fetch(endpoint);
			if (response.ok === false) throw new Error("Feed request failed");
			const feed = await response.json();
			if (!Array.isArray(feed.items)) throw new Error("Invalid book feed");
			if (requestID === feedRequestRef.current) setData(feed.items);
		} catch (error) {
			if (requestID === feedRequestRef.current) setLoadError("Couldn't load books. Please try again.");
		} finally {
			if (requestID === feedRequestRef.current) {
				setLoaded(true);
				setRefreshing(false);
			}
		}
	}
	
	function onRefresh() {
		setRefreshing(true);
		loadBooks();
	}
	
	function bestColumnsForWidth(width) {
		if (Platform.isPad) {
			// Target 160 points per column, including cover spacing, within this pane.
			return Math.max(1, Math.round((width - 16) / 160));
		}
		var cols = Math.round(width / 150);
		if (cols < 3) {
			cols = 3;
		}

		return cols;
	}
	
	function copyToBookshelf(bookshelf_id, isbn, title, author, image, id) {
		setItemUpdating(id.toString())
		
		let form = new FormData();
		form.append("isbn", isbn);
		form.append("title", title);
		form.append("author", author);
		form.append("cover_url", image);
		form.append("bookshelf_id", bookshelf_id);
		
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				method: "POST",
				body: form,
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
		
			// setProgressAnimating(true);
		
			fetch("https://micro.blog/books", options).then(response => response.json()).then(data => {
				refreshAllBookshelfCachesInBackground();
				console.log("Copied");
			});
			setTimeout(() => {
				setItemUpdating(null)
			}, 1200)
		});
	}
	
	const onShare = async (url, title, author) => {
		try { 
			const result = await Share.share({
				message: title + ' by ' + author,
				url: url,
			})
			if (result.action === Share.sharedAction) {
				if (result.activityType) {
					switch (result.activityType) {
						case 'com.apple.UIKit.activity.CopyToPasteboard':
							Clipboard.setString(url)
							break
					}
				} else {	
					
				}
			} else if (result.action === Share.dismissedAction) {
				
			}
		} catch (error) {
			alert(error.message)
		}
	}
	
	const onOpen = async (url) => {
		let result = await InAppBrowser.open(url, {
			animated: true
		});
	}

	const onCopyToBookshelfName = async (bookshelf_name, book_item) => {
		epilogueStorage.get(keys.allBookshelves).then(bookshelves => {
			var found_bookshelf;
			for (var item of bookshelves) {
				if (item.title == bookshelf_name) {
					found_bookshelf = item;
					break;
				}
			}
			
			if (found_bookshelf != undefined) {
				copyToBookshelf(found_bookshelf.id, book_item._microblog.isbn, book_item._microblog.book_title, book_item._microblog.book_author, book_item._microblog.cover_url, book_item.id);
			}
		});
	}

	function onShowBookPressed(item) {
		epilogueStorage.get(keys.allBookshelves).then(bookshelves => {
			epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
				bookshelfMembershipIDsForItem(item, current_bookshelf).then(bookshelf_ids_with_book => {
					var params = {
						id: item.id,
						isbn: item.isbn,
						title: item.title,
						image: item.image,
						author: item.author,
						author_id: item.author_id,
						description: item.description,
						background_color: item.background_color,
						background_url: item.background_url,
						bookshelves: bookshelves,
						current_bookshelf: current_bookshelf,
						is_search: item.is_search,
						bookshelf_ids_with_book: bookshelf_ids_with_book
					};
					navigation.navigate("Details", params);
				});
			});
		});
	}

	function bookshelfMembershipIDsForItem(item, current_bookshelf) {
		const fallback_ids = (!item.is_search && current_bookshelf?.id != null) ? [String(current_bookshelf.id)] : [];
		return readBookshelfIDsContainingBook(item.isbn, item.id).then(ids => {
			const all_ids = fallback_ids.concat(ids.map(shelf_id => String(shelf_id)));
			return Array.from(new Set(all_ids));
		}).catch(() => {
			return fallback_ids;
		});
	}
	
	function onChangeSearch(text) {		
		// if we're clearing the text, wait a second and then send it
		// otherwise the user is still typing
		if (text.length == 0) {
			setTimeout(function() {
				epilogueStorage.remove(keys.currentSearch).then(() => {
					epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
						setSearching(false);
						setBooks([]);
					});				
				});
			}, 500);
		}
		else {
			epilogueStorage.set(keys.currentSearch, text);
		}
	}
	
	function onRunSearch() {
		epilogueStorage.get(keys.currentSearch).then(search_text => {
			let s = String(search_text);
			if ((s != "null") && (s.length > 0)) {
				setSearching(true);
				sendSearch(search_text);
			}
			else {
				epilogueStorage.remove(keys.currentSearch).then(() => {
					epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
						setSearching(false);
						setBooks([]);
					});				
				});
			}
		});
	}

	function searchResultItems(new_books, searchText) {
		var new_items = [];

		for (let b of new_books) {
				new_items.push({
					id: b.id,
					isbn: b.isbn,
					title: b.title,
					image: b.cover_url,
					author: b.author,
					author_id: b.author_id,
					description: b.description,
					background_color: b.background_color,
					background_url: b.background_url,
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

	function sendSearch(searchText) {
		if (Book.isISBN(searchText)) {
			Book.searchOpenLibrary(searchText, function(new_books) {				
				if (new_books.length > 0) {				
					setBooks(searchResultItems(new_books, searchText));
				}
				else {
					Book.searchMicroBooks(searchText, function(new_books) {
						setBooks(searchResultItems(new_books, searchText));
					});
				}
				
			});
		}
		else {		
			Book.searchMicroBooks(searchText, function(new_books) {
				setBooks(searchResultItems(new_books, searchText));
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

	const BookCover = ({ url, title, author, id }) => {
		if (url !== '') {
			return (
				<FastImage style={styles.bookCovers} resizeMode="cover" source={{
					uri: url
				}}/>
			)
		} else {
			return (
				<View >
					<Text style={styles.placeholderTitleText}>
						{title}
					</Text>
					<Text style={styles.placeholderAuthorText}>
						{author}
					</Text>
				</View>
			)
		}
	}
	
	function onDiscoverBookPressed(item) {
		if (source !== "nyt") {
			return onOpen(item.url);
		}
		const book = booksFromJSONFeed({ items: [item] })[0];
		onShowBookPressed({
			...book,
			is_search: true
		});
	}

	const renderItem =({item}) => (
		<View style={{flex: 1/columns}}>
			<ContextMenu
				title={item._microblog.book_title}
				onPress={({nativeEvent}) => {
					// let shelf_id = nativeEvent.event;
					if (nativeEvent.name === 'Share') {
						let url = "https://micro.blog/books/" + item._microblog.isbn;
						onShare(url, item._microblog.book_title, item._microblog.book_author);
					}
					else {
						onCopyToBookshelfName(nativeEvent.name, item);
					}
				}}
				actions={menuActions}
				dropdownMenuMode={false}
			>
				<TouchableOpacity 
					onPress={() => { onDiscoverBookPressed(item) }}
					onLongPress={() => { return null }}
					style={[styles.bookContainer, Platform.isPad
						? { flex: 0, height: undefined, aspectRatio: 2 / 3, ...(item._microblog.cover_url ? { backgroundColor: "transparent" } : {}) }
						: { height: 176 }]}>
					
					<View style={[styles.addingBookSpinner, {opacity: itemUpdating === item.id.toString() ? 0.5 : 0.0, backgroundColor: itemUpdating === item.id.toString() ? '#111' : null, zIndex: itemUpdating === item.id.toString() ? 5 : 0}]}>
						<ActivityIndicator color={'#fff'} animating={itemUpdating===item.id.toString()} hidesWhenStopped={true}/>
					</View>
					
					<BookCover 
						url={item._microblog.cover_url} 
						title={item._microblog.book_title} 
						author={item._microblog.book_author}
						id={item.id}
					/>	
				</TouchableOpacity>	
			</ContextMenu>
		</View>
	)


	const renderSearchItem = ({item}) => (
		item.is_new_book_row ? (
			<View style={styles.bookSearchEmptyRow}>
				<Text style={styles.bookSearchEmptyText}>Can't find a book? Try searching for its ISBN or add a new book.</Text>
				<Pressable style={styles.micropubButton} onPress={() => { onAddBookInfoPressed(item.searchText); }}>
					<Text style={styles.micropubButtonTitle}>New Book</Text>
				</Pressable>
			</View>
		) : (
		<Pressable
			onPress={() => { onShowBookPressed(item) }}
			style={({ pressed }) => pressed ? styles.bookListItemPressed : null}
			unstable_pressDelay={100}
		>
			<View style={styles.item}>
				<FastImage style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
				<View style={styles.bookItem}>
					<Text style={styles.bookTitle} ellipsizeMode="tail" numberOfLines={2}>{item.title}</Text>
					<Text style={styles.bookAuthor}>{item.author}</Text>
				</View>
			</View>
		</Pressable>
		)
	);

	const renderTabBacking = () => (
		shouldShowTabBacking ? (
			<View pointerEvents="none" style={styles.discoverTabBacking} />
		) : null
	);
	
	return (
		<View style={{ flex: 1 }} onLayout={({ nativeEvent }) => {
			setColumns(bestColumnsForWidth(nativeEvent.layout.width));
		}}>
		{loadError ? (
			<View style={styles.loadingPage}>
				<Text style={{ color: dark ? "white" : "black" }}>{loadError}</Text>
				<Pressable testID="discover-retry" accessibilityRole="button" onPress={() => { setLoaded(false); loadBooks(); }} style={sourceStyles.retry}>
					<Text style={{ color: dark ? "#FFB45A" : "#C85F00" }}>Try Again</Text>
				</Pressable>
			</View>
		) : loaded === true ? (
			searching === true ? (
				<View style={styles.discoverView}> 
					<TextInput style={styles.searchField} onChangeText={onChangeSearch} onEndEditing={onRunSearch} returnKeyType="search" placeholder="Search for books to add" placeholderTextColor="#6d6d72" clearButtonMode="always" />
					<FlatList
						contentInsetAdjustmentBehavior="automatic"
						ref={discoverListRef}
						data = {books}
						key = "BooksList"
						renderItem = {renderSearchItem}
						keyExtractor = { item => item.id }
						style={styles.discoverSearchResults}
					/>
					{renderTabBacking()}
				</View>
			) : (
				<View style={styles.discoverView}> 
					<TextInput style={styles.searchField} onChangeText={onChangeSearch} onEndEditing={onRunSearch} returnKeyType="search" placeholder="Search for books to add" placeholderTextColor="#6d6d72" clearButtonMode="always" />
					<FlatList
						contentInsetAdjustmentBehavior="automatic"
						ref={discoverListRef}
						data={data}
						key={columns}
						keyExtractor={(item) => item.id.toString()}
						numColumns={columns}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
						}
						renderItem={renderItem}
						style={styles.discoverResults}
					/>
					{renderTabBacking()}
				</View>
			)
		) : (
			<View style={styles.loadingPage}>
				<ActivityIndicator size='small'/>
			</View>
		)}
		</View>
	)
}

const sourceStyles = StyleSheet.create({
	control: { flexDirection: "row", padding: 3, borderRadius: 10 },
	segment: { width: 44, height: 32, borderRadius: 7, alignItems: "center", justifyContent: "center" },
	icon: { width: 24, height: 24, resizeMode: "contain" },
	retry: { padding: 12 }
});
