import React, { useState } from "react";
import type { Node } from "react";
import { TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import { keys } from "./Constants";
import styles from "./Styles";
import epilogueStorage from "./Storage";

export function PostScreen({ navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const [ text, setText ] = useState();
	const [ blogID, setBlogID ] = useState();
	const [ blogName, setBlogName ] = useState();
	const [ progressAnimating, setProgressAnimating ] = useState(false);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		setupPostButton();
		setupFields();
	}
	
	function onShowBlogs() {
		navigation.navigate("Blogs");
	}
		
	function onChangeText(text) {
		setText(text);
		epilogueStorage.set("current_text", text);
	}
	
	function setupPostButton() {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onSendPost(); }}>
				<Text style={is_dark ? [ styles.navbarSubmit, styles.dark.navbarSubmit ] : styles.navbarSubmit}>Post</Text>
			  </Pressable>
			)
		});		
	}
	
	function setupFields() {
		epilogueStorage.get("current_text").then(current_text => {
			if (current_text != null) {
				setText(current_text);
			}
		});
		
		epilogueStorage.get(keys.currentBlogName).then(blog_name => {
			setBlogName(blog_name);
		});

		epilogueStorage.get(keys.currentBlogID).then(blog_id => {
			setBlogID(blog_id);
		});
	}
	
	function onSendPost() {
		setProgressAnimating(true);
		
		epilogueStorage.get("current_text").then(current_text => {
			epilogueStorage.get("current_blog_id").then(blog_id => {
				let form = new FormData();
				form.append("content", current_text);
				form.append("mp-destination", blog_id);
								
				epilogueStorage.get("auth_token").then(auth_token => {
					var options = {
						method: "POST",
						body: form,
						headers: {
							"Authorization": "Bearer " + auth_token
						}
					};
				
					// setProgressAnimating(true);
				
					fetch("https://micro.blog/micropub", options).then(response => response.json()).then(data => {
						navigation.goBack();
					});
				});
			});
		});
	}
	
	return (
		<View style={is_dark ? [ styles.postTextBox, styles.dark.postTextBox ] : styles.postTextBox}>
			<Pressable style={is_dark ? [ styles.postHostnameBar, styles.dark.postHostnameBar ] : styles.postHostnameBar} onPress={onShowBlogs}>
				<Text style={styles.postHostnameLeft}></Text>
				<Text style={is_dark ? [ styles.postHostnameText, styles.dark.postHostnameText ] : styles.postHostnameText}>{blogName}</Text>
				<ActivityIndicator style={styles.postHostnameProgress} size="small" animating={progressAnimating} />
			</Pressable>
			<TextInput style={is_dark ? [ styles.postTextInput, styles.dark.postTextInput ] : styles.postTextInput} value={text} onChangeText={onChangeText} multiline={true} />
		</View>
	);
}
