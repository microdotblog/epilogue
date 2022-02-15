import React, { useState } from "react";
import type { Node } from "react";
import { FlatList, ActivityIndicator, useColorScheme, Pressable, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import styles from "./Styles";
import epilogueStorage from "./Storage";

export function BlogsScreen({ navigation }) {
	const [ blogs, setBlogs ] = useState([]);
	
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		loadBlogs();
	}
	
	function loadBlogs() {
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
						
			fetch("https://micro.blog/micropub?q=config", options).then(response => response.json()).then(data => {
				var new_items = [];
				for (blog of data.destination) {
					new_items.push({
						id: blog.uid,
						name: blog.name
					});
				}
				
				setBlogs(new_items);
			});
			
		});
	}
	
	function onSelectBlog(blog) {		
	}
	
	return (
		<View>
			<FlatList
			data = {blogs}
			renderItem = { ({item}) => 
			<Pressable style={styles.blogListItem} onPress={() => { onSelectBlog(item) }}>
				<Text style={styles.blogListName}>{item.name}</Text>
			</Pressable>
			}
			keyExtractor = { item => item.id }
			/>
		</View>
	);
}
