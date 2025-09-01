import React, { useState } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView, Share, useColorScheme } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";
import ContextMenu from "react-native-context-menu-view";
import { InAppBrowser } from 'react-native-inappbrowser-reborn'

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Icon } from "../Icon";
import { Note } from "../models/Note";
import CryptoUtils from '../utils/crypto';

export function BookDetailsScreen({ route, navigation }) {
	const styles = useEpilogueStyle()
	const is_dark = (useColorScheme() == "dark");
	const [ data, setData ] = useState();
	const [ progressAnimating, setProgressAnimating ] = useState(false);
	const [ menuActions, setMenuActions] = useState([])	
	const [ notes, setNotes] = useState([])
	const [ hasSecretKey, setHasSecretKey ] = useState(false)	
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
				title: "Open Library"
			},
			{
				id: "worldcat",
				title: "WorldCat"
			},
		];
		
		if (Platform.OS === "ios") {
			var edit_actions = [];
			var share_actions = [];

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

			share_actions.push({
				id: "sharebutton",
				title: "Share",
				systemIcon: "square.and.arrow.up"
			})

			menu_items.push({
				id: "edit",
				title: "Edit Book...",
				inlineChildren: true,
				actions: edit_actions
			});

			menu_items.push({
				id: "sharelabel",
				title: "micro.blog/books/" + isbn,
				inlineChildren: true,
				actions: share_actions
			})
		}
		
		setMenuActions(menu_items);

		// check for notes key and refresh notes if available
		Note.hasSecretKey().then((hasKey) => {
			setHasSecretKey(hasKey)
			if (hasKey) {
				fetchNotesForBook();
			} else {
				setNotes([])
			}
		})
	}

	function fetchNotesForBook() {
		// fetch notes for this book
		epilogueStorage.get(keys.authToken).then(auth_token => {
			const url = "https://micro.blog/notes/for_book?isbn=" + encodeURIComponent(isbn);
			const options = {
				method: "GET",
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};

			fetch(url, options)
				.then(response => response.json())
				.then(json => {
					epilogueStorage.get(keys.notesKey).then(secret_key => {
						let new_notes = [];
						for (let n of json.items) {
							let t = CryptoUtils.decrypt(n.content_text, secret_key);
							new_notes.push({
								id: n.id,
								text: t
							});
						}
						setNotes(new_notes);
					});
				})
				.catch(error => {
					setNotes([]);
				});
		});
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
		else if (service == "Open Library") {
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

	function onAddNotePressed() {
		// Navigate to the Note screen for adding a new note
		// Pass along identifiers if needed later for saving
		let params = {
			bookId: id,
			isbn: isbn
		};
		navigation.navigate("Note", params);
	}

	function onEditNotePressed(item) {
		navigation.navigate("Note", { item });
	}

	return (
		<ScrollView style={styles.bookDetailsScroll}>
			<View style={styles.container}>
				<ContextMenu
						title="View on..."
						onPress={({nativeEvent}) => {
							viewBookOn(nativeEvent.name);
							if (nativeEvent.name === "Share") {
								let url = "https://micro.blog/books/" + isbn
								onShare(url)
							}
						}}
						actions={menuActions}
						previewBackgroundColor="rgba(0, 0, 0, 0.0)"
						dropdownMenuMode={true}
				>
					<View style={styles.bookDetails}>
						<View style={styles.bookDetailsTop}>
							<Image style={styles.bookDetailsCover} source={{ uri: image.replace("http://", "https://") }} />
						</View>
						<View style={styles.bookDetailsColumns}>
							<View style={styles.bookDetailsFields}>
								<Text style={styles.bookDetailsTitle}>{title}</Text>
								<Text style={styles.bookDetailsAuthor}>{author}</Text>
							</View>
							<View style={styles.bookDetailsMenuContainer} pointerEvents="none">
								<Icon
									name="ellipsis"
									size={18}
									color={is_dark ? "#FFFFFF" : "#337AB7"}
									style={styles.bookDetailsMenuIcon}
								/>
							</View>
						</View>
					</View>
				</ContextMenu>
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
				{ hasSecretKey ? (
					<View style={styles.bookDetailsNotesSection}>
						<View style={styles.bookDetailsNotesHeader}>
							<Text style={styles.bookDetailsNotesTitle}>Notes</Text>
							<Pressable style={styles.plainButton} onPress={() => { onAddNotePressed(); }}>
								<Text style={styles.plainButtonTitle} accessibilityLabel="add new reading note">Add Note...</Text>
							</Pressable>
						</View>
						<FlatList
							data={notes}
							keyExtractor = { item => item.id }
							renderItem={({ item }) => (
								<Pressable onPress={() => onEditNotePressed(item)}>
									<View style={{ paddingTop: 8 }}>
										<Text>{item.text}</Text>
									</View>
								</Pressable>
							)}
							scrollEnabled={false}
						/>
					</View>
				) : null }
			</View>
		</ScrollView>
	);
}
