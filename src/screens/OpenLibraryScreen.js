import React, { useState } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, FlatList, StyleSheet, Text, View } from "react-native";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

export function OpenLibraryScreen({ route, navigation }) {
	const styles = useEpilogueStyle();

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	

	const onFocus = (navigation) =>  {
		setupProfileIcon();
	}

	function setupProfileIcon() {
		epilogueStorage.get(keys.currentUsername).then(username => {
			let avatar_url = "https://micro.blog/" + username + "/avatar.jpg";
			navigation.setOptions({
				headerLeft: () => (
					<Pressable onPress={() => { onShowProfile(); }} accessibilityRole="button" accessibilityLabel="show profile">
						<Image style={styles.profileIcon} source={{ uri: avatar_url }} />
					</Pressable>
				)
			});		
		});
	}	
	
	function onShowProfile() {
		navigation.navigate("Profile");
	}	
	return (
		<View style={styles.container}>
			<View style={styles.openLibraryBanner}>
				<Text style={styles.openLibraryIntro}>Sign in with an account on the Internet Archive's Open Library to update book covers. Everyone using Open Library or Epilogue will be able to use your book covers.</Text>
			</View>
		</View>
	)
}