import React, { useState } from "react";
import type { Node } from "react";
import { FlatList, ActivityIndicator, useColorScheme, Pressable, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import { keys } from "./Constants";
import styles from "./Styles";
import epilogueStorage from "./Storage";

export function BlogsScreen({ navigation }) {
	const is_dark = (useColorScheme() == "dark");
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
			var use_token = auth_token;
			epilogueStorage.get(keys.micropubToken).then(micropub_token => {
				if (micropub_token != undefined) {
					use_token = micropub_token;
				}
				
				var options = {
					headers: {
						"Authorization": "Bearer " + use_token
					}
				};

				epilogueStorage.get(keys.micropubURL).then(micropub_url => {
					var use_url = micropub_url;
					if (use_url == undefined) {
						use_url = "https://micro.blog/micropub";
					}
					
					if (use_url.includes("?")) {
						use_url = use_url + "&q=config";
					}
					else {
						use_url = use_url + "?q=config";
					}
							
					fetch(use_url, options).then(response => response.json()).then(data => {
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
			});
		});
	}
	
	function onSelectBlog(blog) {	
		epilogueStorage.set("current_blog_id", blog.id);
		epilogueStorage.set("current_blog_name", blog.name);

		navigation.goBack();
	}
	
	return (
		<View style={is_dark ? [ styles.blogListContainer, styles.dark.blogListContainer ] : styles.blogListContainer}>
			<FlatList
			data = {blogs}
			renderItem = { ({item}) => 
			<Pressable style={is_dark ? [ styles.blogListItem, styles.dark.blogListItem ] : styles.blogListItem} onPress={() => { onSelectBlog(item) }}>
				<Text style={is_dark ? [ styles.blogListName, styles.dark.blogListName ] : styles.blogListName}>{item.name}</Text>
			</Pressable>
			}
			keyExtractor = { item => item.id }
			/>
		</View>
	);
}
