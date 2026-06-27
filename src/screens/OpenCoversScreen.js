import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, StyleSheet, Text, View, TextInput, FlatList, useColorScheme } from "react-native";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Book } from "../models/Book";
import { Icon } from "../Icon";
import { refreshAllBookshelfCachesInBackground } from "../BookshelfCache";

export function OpenCoversScreen({ route, navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const styles = useEpilogueStyle();
	const [ isUploading, setIsUploading ] = useState(false);
	const [ isSearching , setIsSearching ] = useState(false);
	const [ books, setBooks ] = useState([]);
	const [ searchText , setSearchText ] = useState("");
	const { id, bookshelf_id, isbn, title } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	const onFocus = (navigation) =>  {
		sendInitialSearch();
	}

	function onChangeSearch(text) {
		if (text.length == 0) {
			setSearchText("");
			setTimeout(function() {
				setBooks([]);
				setIsSearching(false);
			}, 500);			
		}
		else {
			setSearchText(text);
		}
	}
	
	function onRunSearch() {
		setBooks([]);
		if (searchText.length == 0) {
			setIsSearching(false);			
		}
		else {
			sendSearch(searchText);
		}
	}

	function sendInitialSearch() {
		const titleSearchText = (title || "").trim();

		sendSearch(isbn, {
			onComplete: () => {
				if ((titleSearchText.length > 0) && (titleSearchText != isbn)) {
					sendSearch(titleSearchText, { append: true });
				}
				else {
					setIsSearching(false);
				}
			}
		});
	}

	function coverResultItems(new_books) {
		let new_items = [];

		for (let b of new_books) {
			if ((b.cover_url || "").trim().length == 0) {
				continue;
			}

			new_items.push({
				id: b.id,
				isbn: b.isbn,
				title: b.title,
				image: b.cover_url,
				author: b.author,
				description: b.description,
				work_key: b.work_key
			});
		}

		return new_items;
	}

	function appendCoverResults(current_items, new_items) {
		const existing_urls = new Set((current_items || []).map(item => item.image));
		const appended_items = new_items.filter(item => !existing_urls.has(item.image));
		return [ ...(current_items || []), ...appended_items ];
	}

	function sendSearch(searchText, options = {}) {
		const append = options.append || false;
		const onComplete = options.onComplete || null;

		setIsSearching(true);
		Book.searchOpenLibrary(searchText, function(new_books) {
			const new_items = coverResultItems(new_books);

			if (append) {
				setBooks(current_items => appendCoverResults(current_items, new_items));
			}
			else {
				setBooks(new_items);
			}

			if (onComplete != null) {
				onComplete();
			}
			else {
				setIsSearching(false);
			}
		});
	}

	function onSelectBookPressed(item) {
		sendCover(bookshelf_id,id, item.image);
	}
	
	function sendCover(bookshelf_id, book_id, cover_url) {
		setIsUploading(true);

		epilogueStorage.get("auth_token").then(auth_token => {
			let form = new FormData();
			form.append("cover_url", cover_url);

			var options = {
				method: "POST",
				body: form,
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};

			let url = `https://micro.blog/books/bookshelves/${bookshelf_id}/cover/${book_id}`;
			fetch(url, options).then(response => response.json()).then(data => {
				refreshAllBookshelfCachesInBackground();
				navigation.pop();
			});
		});
	}
	
	return (
		<View style={[styles.container]}>
			<View style={styles.openLibraryBanner}>
				<Text style={styles.openLibraryIntro}>Set your book cover from images hosted on the Internet Archive's Open Library.</Text>
			</View>

			<View style={styles.openLibraryCoverSearch}>
				<TextInput style={[ styles.searchField, styles.openLibrarySearch ]} onChangeText={onChangeSearch} onEndEditing={onRunSearch} returnKeyType="search" placeholder="Search for book covers" placeholderTextColor="#6d6d72" clearButtonMode="always" />

				{ isSearching && 
					<ActivityIndicator style={styles.openLibrarySearchSpinner} animating={true} hidesWhenStopped={true} />						
				}
					
				<FlatList
					data = {books}
					renderItem = { ({item}) =>
						<View style={styles.coverResults}>
							<FastImage style={styles.mediumBookCover} source={{ uri: item.image.replace("http://", "https://") }} />
							<View style={styles.coverResultsOptions}>
								<View style={styles.coverResultsButtonProgress}>
									<Pressable style={styles.useThisCoverButton} onPress={() => {
										onSelectBookPressed(item);
									}}>
										<Text style={styles.useThisCoverTitle}>Use This Cover</Text>
									</Pressable>
									{ isUploading && 
										<ActivityIndicator animating={true} hidesWhenStopped={true} />				
									}
								</View>
							</View>
						</View>
					}
					keyExtractor = { item => item.id }
				/>
			</View>
		</View>
	);
}
