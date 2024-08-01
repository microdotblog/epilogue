import React, { useState } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView, Share } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";
import ContextMenu from "react-native-context-menu-view";
import { InAppBrowser } from 'react-native-inappbrowser-reborn'

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

export function BookDetailsScreen({ route, navigation }) {
	const styles = useEpilogueStyle()
	const [ data, setData ] = useState();
	const [ progressAnimating, setProgressAnimating ] = useState(false);
	const [ menuActions, setMenuActions] = useState([])	
	const { id, isbn, title, image, author, description, date, bookshelves, current_bookshelf, is_search } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);
	
	function onFocus(navigation) {
		let bookshelf_title = current_bookshelf.title;
		let s = bookshelf_title + ": [" + title + "](https://micro.blog/books/" + isbn + ") by " + author + " 📚";
		epilogueStorage.set(keys.currentTitle, "");
		epilogueStorage.set(keys.currentText, s);
		epilogueStorage.set(keys.currentTextExtra, "");
		epilogueStorage.remove(keys.currentPostURL);

		var menu_items = [
			{
				id: "amazon",
				title: "Amazon"
			},
				{
				id: "goodreads",
				title: "Goodreads"
			},
				{
				id: "bookshop",
				title: "Bookshop.org"
			},
			{
				id: "openlibrary",
				title: "OpenLibrary"
			},
			{
				id: "worldcat",
				title: "WorldCat"
			},
		];
		
		if (Platform.OS === "ios") {
			var edit_actions = [];
			if (current_bookshelf.type == "finished") {
				edit_actions.push({
					id: "setfinisheddate",
					title: "Set Finished Date"
				});
			}

			edit_actions.push({
				id: "setopenlibrary",
				title: "Set Cover from Open Library"
			});

			menu_items.push({
				id: "edit",
				title: "Edit Book...",
				inlineChildren: true,
				actions: edit_actions
			});

			menu_items.push({
				id: "share",
				title: "Share",
				systemIcon: "square.and.arrow.up",
			})
		}
		
		setMenuActions(menu_items);
	}

	async function onShare(url) {
		try {
			const result = await Share.share({
				message: url
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
			Alert.alert(error.message)
		}
	}
	
	function addToBookshelf(bookshelf_id) {
		if (is_search) {
			copyToBookshelf(bookshelf_id);
		}
		else {
			assignToBookshelf(bookshelf_id);
		}
	}

	function assignToBookshelf(bookshelf_id) {
		let form = new FormData();
		form.append("book_id", id);
		
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				method: "POST",
				body: form,
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
		
			setProgressAnimating(true);
		
			fetch("https://micro.blog/books/bookshelves/" + bookshelf_id + "/assign", options).then(response => response.json()).then(data => {
				navigation.goBack();
			});
		});
	}
	
	function copyToBookshelf(bookshelf_id) {
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
		
			setProgressAnimating(true);
		
			fetch("https://micro.blog/books", options).then(response => response.json()).then(data => {
				epilogueStorage.remove(keys.currentSearch).then(() => {
					navigation.goBack();
				});
			});
		});
	}
	
	function showDatePicker() {
		let params = {
			id: id,
			bookshelf_id: current_bookshelf.id,
			isbn: isbn,
			date_finished: date
		};
		navigation.navigate("DatePicker", params);
	}
	
	function showCovers() {		
		let params = {
			id: id,
			bookshelf_id: current_bookshelf.id,
			isbn: isbn
		};
		navigation.navigate("Covers", params);
	}
	
	function viewBookOn(service) {
		var url;
		
		if (service == "Amazon") {
			url = "https://www.amazon.com/s?field-keywords=" + isbn;
		}
		else if (service == "Goodreads") {
			url = "https://www.goodreads.com/search?q=" + isbn;
		}
		else if (service == "Bookshop.org") {
			url = "https://bookshop.org/books?keywords=" + isbn;
		}
		else if (service == "OpenLibrary") {
			url = "https://openlibrary.org/search?q=" + isbn;
		}
		else if (service == "WorldCat") {
			url = "https://www.worldcat.org/search?q=" + isbn;
		}
		else if (service == "Set Finished Date") {
			showDatePicker();
		}
		else if (service == "Set Cover from Open Library") {
			showCovers();
		}
		
		if (url != undefined) {
			InAppBrowser.open(url)
		}
	}

	return (
		<ScrollView style={styles.bookDetailsScroll}>
			<View style={styles.container}>
				<View style={styles.bookDetails}>
					<ContextMenu
							title="View on..."
							onPress={({nativeEvent}) => {
								viewBookOn(nativeEvent.name);
								if (nativeEvent.name === "Share	") {
									let url = "https://micro.blog/books/" + isbn
									onShare(url)
								}
							}}
							actions={menuActions}
							previewBackgroundColor="rgba(0, 0, 0, 0.0)"
							dropdownMenuMode={true}
						>
						<Image style={styles.bookDetailsCover} source={{ uri: image.replace("http://", "https://") }} />
					</ContextMenu>
					
					<Text style={styles.bookDetailsTitle}>{title}</Text>
					<Text style={styles.bookDetailsAuthor}>{author}</Text>
				</View>
				<View style={styles.bookDetailsBookshelves}>
					<View style={styles.bookDetailsAddBar}>
					<Text style={styles.bookDetailsAddTo}>Add to bookshelf...</Text>
					<ActivityIndicator style={styles.BookDetailsProgress} size="small" animating={progressAnimating} />
				</View>
				{
					bookshelves.map((shelf) => {
						if (shelf.type != "loans" && shelf.type != "holds") {
							return (
								<Pressable key={shelf.id} onPress={() => { addToBookshelf(shelf.id); }} style={({ pressed }) => [
									styles.bookDetailsButton,
									(pressed ? styles.bookDetailsButtonPressed : styles.bookDetailsButton)
								]}>
									<Text style={styles.bookDetailsBookshelfTitle}>{shelf.title}</Text>
									<Text style={styles.bookDetailsBookshelfCount}>{shelf.books_count}</Text>
								</Pressable>
							)
						}
					})
				}
				</View>
				<View style={
					description.length > 0 ?
					(styles.bookDetailsMore) :
					styles.bookDetailsNoDescription
					}>
					<Text style={styles.bookDetailsDescription}>{description}</Text>
				</View>
			</View>
		</ScrollView>
	);
}
