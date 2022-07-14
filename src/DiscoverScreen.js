
import React, { useState } from "react";
import { FlatList, Image, View, TouchableOpacity, Linking, Text } from 'react-native';

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import EpilogueStorage from "./Storage";

export function DiscoverScreen({ navigation }) {
	const styles = useEpilogueStyle()

	const [ data, setData ] = useState()
	
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		loadBooks();
	}
	
	function loadBooks() {
		fetch("https://micro.blog/posts/discover/books").then(response => response.json()).then(data => {
			setData(data.items)
		})
	}
	
	const BookCover = ({ url, id }) => {
		if (url !== '') {
			return (
				<Image style={styles.bookCovers} source={{ 
					uri: url
				}}/>
			)
		} else {
			return (
				<Text>{id}</Text>
			)
		}
	}
	
	return (
		<View style={styles.container}>
			<FlatList
				data={data}
				numColumns={3}
				renderItem={({ item }) => (
					<TouchableOpacity onPress={() => { Linking.openURL(item.url) }} style={styles.bookCoverButtons}>
						<BookCover url={item._microblog.cover_url} id={item.id}/>
					</TouchableOpacity>
				)}/>
		</View>
	);
}