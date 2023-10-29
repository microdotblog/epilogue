import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, StyleSheet, Text, View, TextInput, FlatList, useColorScheme } from "react-native";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Book } from "../Book";
import { Icon } from "../Icon";

export function OpenCoversScreen({ route, navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const styles = useEpilogueStyle();
	const [ isUploading, setIsUploading ] = useState(false);
	const [ isSearching , setIsSearching ] = useState(false);
	const [ books, setBooks ] = useState([]);
	const [ searchText , setSearchText ] = useState("");
	const [ columns, setColumns ] = useState(3);
	const { title, isbn, image, work_key, edition_key } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	const onFocus = (navigation) =>  {
		sendSearch(isbn);
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
		if (searchText.length == 0) {
			setIsSearching(false);			
		}
		else {
			sendSearch(searchText);
		}
	}

	function sendSearch(searchText) {
		setIsSearching(true);
		Book.searchOpenLibrary(searchText, function(new_books) {
			if (new_books.length > 0) {				
				var new_items = [];
			
				for (b of new_books) {
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
			
				setBooks(new_items);
				setIsSearching(false);
			}
			else {
				setBooks([]);
				setIsSearching(false);
			}
		});
	}

	function onSelectBookPressed(item) {
	}
	
	return (
		<View style={[styles.container]}>
			<View style={styles.openLibraryBanner}>
				<Text style={styles.openLibraryIntro}>Set your book cover from images hosted on the Internet Archive's Open Library. Use the Open Library tab in Epilogue to manage covers that everyone has access to.</Text>
			</View>

			<View style={styles.openLibraryCoverSearch}>
				<TextInput style={[ styles.searchField, styles.openLibrarySearch ]} onChangeText={onChangeSearch} onEndEditing={onRunSearch} returnKeyType="search" placeholder="Search for book covers" placeholderTextColor="#6d6d72" clearButtonMode="always" />

				{ isSearching && 
					<ActivityIndicator style={styles.openLibrarySearchSpinner} animating={true} hidesWhenStopped={true} />						
				}
					
				<FlatList
					data = {books}
					numColumns = {columns}
					renderItem = { ({item}) => 						
					<Pressable onPress={() => {
							onSelectBookPressed(item);
						}}>
						<FastImage style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
					</Pressable>
					}
					keyExtractor = { item => item.id }
				/>
			</View>
		</View>
	);
}