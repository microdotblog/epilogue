import React, { useState } from "react";
import type { Node } from "react";
import { ActivityIndicator, useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";

import { keys } from "./Constants";
import styles from "./Styles";
import epilogueStorage from "./Storage";

export function BookDetailsScreen({ route, navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const [ data, setData ] = useState();
	const [ progressAnimating, setProgressAnimating ] = useState(false);
	const { id, isbn, title, image, author, bookshelves, current_bookshelf } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		let bookshelf_title = current_bookshelf.title;
		let s = bookshelf_title + ": [" + title + "](https://micro.blog/books/" + isbn + ") by " + author + " 📚";
		epilogueStorage.set("current_text", s);
	}
	
	function addToBookshelf(bookshelf_id) {
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
				navigation.goBack();
			});
		});
	}

	return (
		<View style={is_dark ? [ styles.container, styles.dark.container ] : styles.container}>
			<View style={is_dark ? [ styles.bookDetails, styles.dark.bookDetails ] : styles.bookDetails}>
				<Image style={styles.bookDetailsCover} source={{ uri: image.replace("http://", "https://") }} />
				<Text style={is_dark ? [ styles.bookDetailsTitle, styles.dark.bookDetailsTitle ] : styles.bookDetailsTitle}>{title}</Text>
				<Text style={is_dark ? [ styles.bookDetailsAuthor, styles.dark.bookDetailsAuthor ] : styles.bookDetailsAuthor}>{author}</Text>
			</View>
			<View style={styles.bookDetailsBookshelves}>
				<View style={styles.bookDetailsAddBar}>
				<Text style={is_dark ? [ styles.bookDetailsAddTo, styles.dark.bookDetailsAddTo ] : styles.bookDetailsAddTo}>Add to bookshelf...</Text>
				<ActivityIndicator style={styles.BookDetailsProgress} size="small" animating={progressAnimating} />
			</View>
			{
				bookshelves.map((shelf) => (
					<Pressable key={shelf.id} onPress={() => { addToBookshelf(shelf.id); }} style={({ pressed }) => [
						{
						backgroundColor: pressed ? 
							(is_dark ? styles.dark.bookDetailsButton.pressed.backgroundColor : styles.bookDetailsButton.pressed.backgroundColor) : 
							(is_dark ? styles.dark.bookDetailsButton.backgroundColor : styles.bookDetailsButton.backgroundColor)
						},
						styles.bookDetailsButton, styles.dark.bookDetailsButton
					]}>
						<Text style={is_dark ? [ styles.bookDetailsBookshelfTitle, styles.dark.bookDetailsBookshelfTitle ] : styles.bookDetailsBookshelfTitle}>{shelf.title}</Text>
						<Text style={is_dark ? [ styles.dark.bookDetailsBookshelfCount, styles.bookDetailsBookshelfCount ] : styles.bookDetailsBookshelfCount}>{shelf.books_count}</Text>
					</Pressable>
				))
			}
			</View>
		</View>
	);
}