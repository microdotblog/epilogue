import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, FlatList, StyleSheet, Text, View } from "react-native";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Book } from "../Book";

export function OpenEditionsScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const [ editions, setEditions ] = useState([]);	
	const { title, author, work_key } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	const onFocus = (navigation) =>  {
		loadEditions();
	}
	
	function loadEditions() {
		Book.downloadOpenLibraryEditions(work_key, function(new_editions) {
			if (new_editions.length > 0) {				
				var new_items = [];
			
				for (e of new_editions) {
					new_items.push({
						id: e.id,
						isbn: e.isbn,
						title: e.title,
						image: e.cover_url,
						language: e.language
					});
				}
			
				setEditions(new_items);
			}
			else {
				setEditions([]);
			}			
		});
	}

	function onShowEditionPressed(edition) {
		var params = {
			title: edition.title,
			isbn: edition.isbn,
			image: edition.image,
			work_key: "",
			edition_key: edition.id.replace("/books/", "")
		};
		navigation.navigate("OLDetails", params);
	}

	return (
		<View style={[styles.container, styles.openLibraryEditionsScreen]}>
			<View style={styles.openLibraryEditionsBar}>
				<Text style={styles.openLibraryEditionsTitle}>{title}</Text>
				<Text style={styles.openLibraryEditionsExtras}>by {author}</Text>
			</View>
			<FlatList
				data = {editions}
				renderItem = { ({item}) => 						
				<Pressable onPress={() => {
						onShowEditionPressed(item);
					}}>
					<View style={styles.item}>
						<FastImage style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
						<View style={styles.bookItem}>
							<Text style={styles.bookTitle} ellipsizeMode="tail" numberOfLines={2}>{item.title}</Text>
							<Text style={styles.bookSecondary}>{item.isbn}</Text>
							<Text style={styles.bookSecondary}>{item.language}</Text>
						</View>
					</View>
				</Pressable>
				}
				keyExtractor = { item => item.id }
			/>
		</View>
	);
}