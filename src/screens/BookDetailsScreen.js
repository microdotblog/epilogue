import React, { useState } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView, Share, Platform, useColorScheme, Animated } from "react-native";
import { MenuView } from "@react-native-menu/menu";
import ContextMenu from "react-native-context-menu-view";
import { InAppBrowser } from 'react-native-inappbrowser-reborn'

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Icon } from "../Icon";
import { Note } from "../models/Note";
import CryptoUtils from '../utils/crypto';
import { refreshAllBookshelfCachesInBackground } from "../BookshelfCache";
import { cacheBookBackgroundImage, cachedBookBackgroundImageURL, cleanupBookBackgroundImageCache } from "../BookBackgroundCache";

const BOOK_DETAILS_COVER_MAX_WIDTH = 200;
const BOOK_DETAILS_COVER_MAX_HEIGHT = 200;
const BOOK_DETAILS_BACKGROUND_OPACITY = 0.2;

export function BookDetailsScreen({ route, navigation }) {
	const styles = useEpilogueStyle()
	const is_dark = (useColorScheme() == "dark");
	const [ data, setData ] = useState();
	const [ progressAnimating, setProgressAnimating ] = useState(false);
	const [ menuActions, setMenuActions] = useState([])	
	const [ notes, setNotes] = useState([])
	const [ hasSecretKey, setHasSecretKey ] = useState(false)	
	const [ coverSize, setCoverSize ] = useState(null)
	const { id, isbn, title, image, author, description, date, background, bookshelves, current_bookshelf, is_search, bookshelf_ids_with_book } = route.params;
	const initial_bookshelf_ids_with_book = bookshelf_ids_with_book || ((!is_search && current_bookshelf?.id != null) ? [current_bookshelf.id] : []);
	const bookshelfIDsWithBook = new Set(initial_bookshelf_ids_with_book.map(shelf_id => String(shelf_id)));
	const coverURL = image.replace("http://", "https://");
	const remoteBackgroundImageURL = normalizedBackgroundImageURL(background);
	const backgroundColor = normalizedBackgroundColor(background);
	const backgroundColorStyle = remoteBackgroundImageURL == null ? backgroundColorStyleWithOpacity(backgroundColor, BOOK_DETAILS_BACKGROUND_OPACITY) : null;
	const backgroundImageOpacity = React.useRef(new Animated.Value(0)).current;
	const [ backgroundImageURL, setBackgroundImageURL ] = useState(null);
	const [ shouldAnimateBackgroundImage, setShouldAnimateBackgroundImage ] = useState(false);

	React.useEffect(() => {
		setupBookDetails();
		refreshNotes();
	}, [navigation, route.params]);

	React.useEffect(() => {
		setCoverSize(null);
	}, [coverURL]);

	React.useEffect(() => {
		let is_cancelled = false;

		backgroundImageOpacity.stopAnimation();
		backgroundImageOpacity.setValue(0);
		setBackgroundImageURL(null);
		setShouldAnimateBackgroundImage(false);

		if (remoteBackgroundImageURL == null) {
			return;
		}

		cleanupBookBackgroundImageCache();
		cachedBookBackgroundImageURL(isbn, remoteBackgroundImageURL).then(cached_url => {
			if (is_cancelled) {
				return;
			}

			if (cached_url != null) {
				backgroundImageOpacity.setValue(BOOK_DETAILS_BACKGROUND_OPACITY);
				setBackgroundImageURL(cached_url);
			}
			else {
				setShouldAnimateBackgroundImage(true);
				setBackgroundImageURL(remoteBackgroundImageURL);
			}
		});

		return () => {
			is_cancelled = true;
		};
	}, [isbn, remoteBackgroundImageURL, backgroundImageOpacity]);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			refreshNotes();
		});
		return unsubscribe;
	}, [navigation, isbn]);
	
	function setupBookDetails() {
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
		
		var edit_actions = [];
		var share_actions = [];

		if (!is_search) {
			edit_actions.push({
				id: "editbook",
				title: "Edit Title & Author"
			});
		}

		if (!is_search) {
			edit_actions.push({
				id: "setopenlibrary",
				title: "Set Cover"
			});
		}

		if (!is_search && current_bookshelf.type == "finished") {
			edit_actions.push({
				id: "setfinisheddate",
				title: "Set Finished Date"
			});
		}

		share_actions.push({
			id: "sharebutton",
			title: "Share",
			systemIcon: "square.and.arrow.up"
		})

		if (Platform.OS === "ios") {
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
		else {
			menu_items.push({
				id: "separator",
				title: "────────────────────",
				disabled: true
			});
			menu_items.push(...edit_actions);
			menu_items.push(...share_actions);
		}
		
		setMenuActions(menu_items);
	}

	function refreshNotes() {
		Note.hasSecretKey().then((hasKey) => {
			setHasSecretKey(hasKey)
			if (hasKey) {
				fetchNotesForBook();
			} else {
				setNotes([])
			}
		})
	}

	function bookIsOnBookshelf(shelf) {
		return bookshelfIDsWithBook.has(String(shelf.id));
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
				.then(async json => {
					epilogueStorage.get(keys.notesKey).then(async secret_key => {
						let new_notes = [];
						for (let n of json.items) {
							let t = await CryptoUtils.decrypt(n.content_text, secret_key);
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
				refreshAllBookshelfCachesInBackground();
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
				refreshAllBookshelfCachesInBackground();
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
			isbn: isbn,
			title: title
		};
		navigation.navigate("Covers", params);
	}

	function showEditBookInfo() {
		let params = {
			id: id,
			bookshelf_id: current_bookshelf.id,
			title: title,
			author: author,
			isbn: isbn
		};
		navigation.navigate("EditBookInfo", params);
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
		else if (service == "Edit Title & Author") {
			showEditBookInfo();
		}
		else if (service == "Set Cover") {
			showCovers();
		}
		
		if (url != undefined) {
			InAppBrowser.open(url)
		}
	}

	function onAddNotePressed() {
		const params = {
			isbn: isbn
		};
		navigation.navigate("Note", params);
	}

	function onEditNotePressed(item) {
		const params = {
			isbn: isbn,
			note: item
		}
		navigation.navigate("Note", params);
	}

	function calculateCoverSize(width, height) {
		if ((width == null) || (height == null) || (width <= 0) || (height <= 0)) {
			return null;
		}

		let cover_ratio = width / height;
		let max_ratio = BOOK_DETAILS_COVER_MAX_WIDTH / BOOK_DETAILS_COVER_MAX_HEIGHT;

		if (cover_ratio > max_ratio) {
			return {
				width: BOOK_DETAILS_COVER_MAX_WIDTH,
				height: BOOK_DETAILS_COVER_MAX_WIDTH / cover_ratio
			};
		}
		else {
			return {
				width: BOOK_DETAILS_COVER_MAX_HEIGHT * cover_ratio,
				height: BOOK_DETAILS_COVER_MAX_HEIGHT
			};
		}
	}

	function onCoverLoad(event) {
		let source = event.nativeEvent?.source;
		let new_size = calculateCoverSize(source?.width, source?.height);

		if (new_size != null) {
			setCoverSize(new_size);
		}
	}

	function onBackgroundImageLoad() {
		if (shouldAnimateBackgroundImage) {
			Animated.timing(backgroundImageOpacity, {
				toValue: BOOK_DETAILS_BACKGROUND_OPACITY,
				duration: 350,
				useNativeDriver: true
			}).start();

			cacheBookBackgroundImage(isbn, remoteBackgroundImageURL);
		}
	}

	function normalizedBackgroundImageURL(background) {
		const url = background?.image || background?.url;
		if ((typeof url != "string") || (url.trim().length == 0)) {
			return null;
		}

		return url.trim().replace("http://", "https://");
	}

	function normalizedBackgroundColor(background) {
		const color = background?.color;
		if ((typeof color != "string") || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color.trim())) {
			return null;
		}

		return color.trim();
	}

	function backgroundColorStyleWithOpacity(color, opacity) {
		if (color == null) {
			return null;
		}

		let hex = color.slice(1);
		if (hex.length == 3) {
			hex = hex.split("").map(char => char + char).join("");
		}
		else if (hex.length == 8) {
			hex = hex.slice(0, 6);
		}

		const red = parseInt(hex.slice(0, 2), 16);
		const green = parseInt(hex.slice(2, 4), 16);
		const blue = parseInt(hex.slice(4, 6), 16);
		return { backgroundColor: `rgba(${red}, ${green}, ${blue}, ${opacity})` };
	}

	return (
		<ScrollView style={styles.bookDetailsScroll}>
			<View style={[styles.container, styles.bookDetailsContainer]}>
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
						<View style={[styles.bookDetailsTop, backgroundColorStyle]}>
							{backgroundImageURL == null ? null : (
								<Animated.Image
									pointerEvents="none"
									style={[styles.bookDetailsBackgroundImage, { opacity: backgroundImageOpacity }]}
									resizeMode="cover"
									source={{ uri: backgroundImageURL }}
									onLoad={onBackgroundImageLoad}
								/>
							)}
							<View style={styles.bookDetailsCoverSlot}>
								<Image
									style={[
										styles.bookDetailsCover,
										coverSize || styles.bookDetailsCoverLoading,
										{ opacity: coverSize == null ? 0 : 1 }
									]}
									source={{ uri: coverURL }}
									onLoad={onCoverLoad}
								/>
							</View>
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
									color={is_dark ? "#FFFFFF" : "#000000"}
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
							const is_on_bookshelf = bookIsOnBookshelf(shelf);
							return (
								<Pressable key={shelf.id} onPress={() => { addToBookshelf(shelf.id); }} style={({ pressed }) => [
									styles.bookDetailsButton,
									(pressed ? styles.bookDetailsButtonPressed : styles.bookDetailsButton)
								]}>
									{is_on_bookshelf ? (
										<Icon name="check-circle" size={17} color={is_dark ? "#E5E7EB" : "#303030"} style={styles.bookDetailsBookshelfCheck} accessibilityLabel="book already on bookshelf" />
									) : null}
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
									<View style={styles.noteCell}>
										<Text style={styles.noteCellText}>{item.text}</Text>
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
