
import React, { useState } from "react";
import { FlatList, Image, View, TouchableOpacity, Linking } from 'react-native';

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import EpilogueStorage from "./Storage";

export function DiscoverScreen({ navigation }) {
	const styles = useEpilogueStyle()

	const [ data, setData ] = useState()
	
	fetch("https://micro.blog/posts/discover/books").then(response => response.json()).then(data => {
		setData(data.items)
	})
	
	return (
		<View style={styles.container}>
			<FlatList
				data={data}
				numColumns={3}
				renderItem={({ item }) => (
					<TouchableOpacity onPress={() => { Linking.openURL(item.url) }} style={styles.bookCoverButtons}>
						<Image style={styles.bookCovers} source={{ 
							uri: item._microblog.cover_url !=="" ? item._microblog.cover_url : undefined 
						}}/>
					</TouchableOpacity>
				)}/>
		</View>
	);
}