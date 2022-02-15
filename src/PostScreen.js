import React, { useState } from "react";
import type { Node } from "react";
import { TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import styles from "./Styles";
import epilogueStorage from "./Storage";

export function PostScreen({ navigation }) {
	const [ text, setText ] = useState();
	
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		epilogueStorage.get("current_text").then(current_text => {
			if (current_text != null) {
				setText(current_text);
			}
		});
	}
	
	function onShowBlogs() {
		navigation.navigate("Blogs");
	}
	
	return (
		<View style={styles.postTextBox}>
			<Pressable style={styles.postHostnameBar} onPress={onShowBlogs}>
				<Text style={styles.postHostnameText}>manton.org</Text>
			</Pressable>
			<TextInput style={styles.postTextInput} value={text} onChangeText={setText} multiline={true} />
		</View>
	);
}
