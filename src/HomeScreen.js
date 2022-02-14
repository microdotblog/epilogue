import React, { useState } from "react";
import type { Node } from "react";
import { TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Animated } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import styles from "./Styles";
import epilogueStorage from "./Storage";

export function HomeScreen({ navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const [ books, setBooks ] = useState();
	const [ bookshelves, setBookshelves ] = useState([]);
	const [ searchText, setSearchText ] = useState("");
  
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);
  
	function onFocus(navigation) {
		// epilogueStorage.set("auth_token", "TESTING").then(() => {
		// });

		// epilogueStorage.remove("current_bookshelf");
		// return;

		epilogueStorage.get("current_search").then(current_search => {
			if ((current_search == null) || (currentSearch.length == 0)) {
				loadBookshelves(navigation);
			}
		});
	}
  
	function loadBooks(bookshelf_id, handler = function() {}) {
		if (bookshelf_id == undefined) {
			return;
		}
		
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
			
			console.log("loadBooks getBookshelves: ", JSON.stringify(bookshelves));
			for (let shelf of bookshelves) {
				if (shelf.id == bookshelf_id) {
					epilogueStorage.set("current_bookshelf", shelf);
				}
			}
			
			fetch("https://micro.blog/books/bookshelves/" + bookshelf_id, options).then(response => response.json()).then(data => {
				var new_items = [];
				for (let item of data.items) {
					var author_name = "";
					if (item.authors.length > 0) {
						author_name = item.authors[0].name;
					}
					new_items.push({
						id: item.id,
						isbn: item._microblog.isbn,
						title: item.title,
						image: item.image,
						author: author_name
					});
				}
				
				setBooks(new_items);
				handler();
			});		
		});
	}
  
	function loadBookshelves(navigation) {
		epilogueStorage.get("auth_token").then(auth_token => {
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
						books_count: s
					});
				}
				
				setBookshelves(new_items);
				epilogueStorage.get("current_bookshelf").then(current_bookshelf => {
					if (current_bookshelf == null) {
						let first_bookshelf = new_items[0];
						epilogueStorage.set("current_bookshelf", first_bookshelf);
						current_bookshelf = first_bookshelf;
					}
					loadBooks(current_bookshelf.id);
					setupBookshelves(navigation, new_items, current_bookshelf.title);
				});
			});		
		});
	}

	function setupBookshelves(navigation, items, currentTitle) {
		navigation.setOptions({
			headerRight: () => (
				<MenuView
				onPressAction = {({ nativeEvent }) => {
					let shelf_id = nativeEvent.event;
					loadBooks(shelf_id, function() {
						epilogueStorage.get("current_bookshelf").then(current_bookshelf => {
							setupBookshelves(navigation, bookshelves, current_bookshelf.title);
						});
					});
				}}
				actions = {items}
				>
					<View style={styles.navbarBookshelf}>
						<Image style={is_dark ? [ styles.navbarBookshelfIcon, styles.dark.navbarBookshelfIcon ] : styles.navbarBookshelfIcon} source={require("../images/books.png")} />
						<Text style={is_dark ? [ styles.navbarBookshelfTitle, styles.dark.navbarBookshelfTitle ] : styles.navbarBookshelfTitle}>{currentTitle}</Text>
					</View>
				</MenuView>
			)
		});
	}

	function sendSearch(searchText) {
		let q = encodeURIComponent(searchText);
	
		var options = {
		};
		
		fetch("https://www.googleapis.com/books/v1/volumes?q=" + q, options).then(response => response.json()).then(data => {
			var new_items = [];
			for (let book_item of data.items) {
				var author_name = "";
				if (book_item.volumeInfo.authors.length > 0) {
					author_name = book_item.volumeInfo.authors[0];
				}

				var cover_url = "";
				if (book_item.volumeInfo.imageLinks != undefined) {
					cover_url = book_item.volumeInfo.imageLinks.smallThumbnail;
					if (cover_url.includes("http://")) {
						cover_url = cover_url.replace("http://", "https://");
					}					
				}

				let isbns = book_item.volumeInfo.industryIdentifiers;
				var best_isbn = "";
				for (let isbn of isbns) {
					if (isbn.type == "ISBN_13") {
						best_isbn = isbn.identifier;
						break;
					}
					else if (isbn.type == "ISBN_10") {
						best_isbn = isbn.identifier;
					}
				}

				if ((best_isbn.length > 0) && (cover_url.length > 0)) {
					new_items.push({
						id: book_item.id,
						isbn: best_isbn,
						title: book_item.volumeInfo.title,
						image: cover_url,
						author: author_name
					});
				}
			}
			
			setBooks(new_items);
		});
	}
	
	function onShowBookPressed(item) {
		var params = {
			id: item.id,
			isbn: item.isbn,
			title: item.title,
			image: item.image,
			author: item.author,
			bookshelves: bookshelves
			};
		navigation.navigate("Details", params);
	}
  
	function removeFromBookshelf() {	  
	}

	function onChangeSearch(text) {
		setSearchText(text);
		
		// if we're clearing the text, wait a second and then send it
		// otherwise the user is still typing
		if (text.length == 0) {
			setTimeout(function() {
				epilogueStorage.remove("current_search").then(() => {
					epilogueStorage.get("current_bookshelf").then(current_bookshelf => {
						loadBooks(current_bookshelf.id);
					});				
				});
			}, 1000);
		}
	}

	function onSearch() {
		if (searchText.length > 0) {
			epilogueStorage.set("current_search", searchText);
			sendSearch(searchText);
		}
		else {
			epilogueStorage.remove("current_search").then(() => {
				epilogueStorage.get("current_bookshelf").then(current_bookshelf => {
					loadBooks(current_bookshelf.id);
				});				
			});
		}
	}

	renderRightActions = (progress, dragX) => {
		const trans = dragX.interpolate({
			inputRange: [0, 50, 100, 101],
			outputRange: [0, 0, 0, 1],
		});
	
		return (
			<RectButton style={styles.removeAction} onPress={() => {
				removeFromBookshelf();
			}}>
			<View style={styles.removeContainer}>
				<Animated.Text style={[ styles.removeText, {
					transform: [{ translateX: trans }],
				}]}>
					Remove
				</Animated.Text>
				</View>
			</RectButton>
		);
	};

	return (
		<View style={is_dark ? [ styles.container, styles.dark.container ] : styles.container}>
			<TextInput style={is_dark ? [ styles.searchField, styles.dark.searchField ] : styles.searchField} onChangeText={onChangeSearch} value={searchText} onEndEditing={onSearch} returnKeyType="search" placeholder="Search for books to add" clearButtonMode="always" />
			<FlatList
				data = {books}
				renderItem = { ({item}) => 
				<Swipeable renderRightActions={renderRightActions}>
					<Pressable onPress={() => { onShowBookPressed(item) }}>
						<View style={is_dark ? [ styles.item, styles.dark.item ] : styles.item}>
							<Image style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
							<View style={styles.bookItem}>
								<Text style={is_dark ? [ styles.bookTitle, styles.dark.bookTitle ] : styles.bookTitle} ellipsizeMode="tail" numberOfLines={2}>{item.title}</Text>
								<Text style={is_dark ? [ styles.bookAuthor, styles.dark.bookAuthor ] : styles.bookAuthor}>{item.author}</Text>
							</View>
						</View>
					</Pressable>
				</Swipeable>
				}
				keyExtractor = { item => item.id }
			/>
		</View>
	);
}