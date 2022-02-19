import React, { useState } from "react";
import type { Node } from "react";
import { Alert, TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import { keys } from "./Constants";
import styles from "./Styles";
import epilogueStorage from "./Storage";

export function ProfileScreen({ navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const [ username, setUsername ] = useState("");
	const [ hostname, setHostname ] = useState("Micro.blog");
	
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		setupSignOutButton();
		
		epilogueStorage.get(keys.currentUsername).then(current_username => {
			setUsername(current_username);
		});

		epilogueStorage.get(keys.micropubURL).then(micropub_url => {
			if ((micropub_url == undefined) || micropub_url.includes("micro.blog")) {
				setHostname("Micro.blog");
			}
			else {
				let pieces = micropub_url.split("/");
				let hostname = pieces[2];
				setHostname(hostname);
			}
		});
	}
	
	function onChangePressed() {
		navigation.navigate("External");
	}

	function onSignOut() {		
		Alert.alert("Sign out of Epilogue?", "", [
		  {
			text: "Cancel",
			style: "cancel"
		  },
		  {
			text: "Sign Out",
			onPress: () => {
			  clearSettings();
			  navigation.goBack();
			}
		  }
		]);
	}
	  
	function clearSettings() {
		epilogueStorage.remove(keys.authToken);
		epilogueStorage.remove(keys.currentUsername);		
		epilogueStorage.remove(keys.currentBlogID);
		epilogueStorage.remove(keys.currentBlogName);
		epilogueStorage.remove(keys.currentBookshelf);
		epilogueStorage.remove(keys.currentSearch);
		epilogueStorage.remove(keys.allBookshelves);
		epilogueStorage.remove(keys.meURL);
		epilogueStorage.remove(keys.authState);
		epilogueStorage.remove(keys.authURL);
		epilogueStorage.remove(keys.tokenURL);
		epilogueStorage.remove(keys.micropubURL);
		epilogueStorage.remove(keys.micropubToken);
		epilogueStorage.remove(keys.lastMicropubToken);
	}

	function setupSignOutButton() {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onSignOut(); }}>
			  	<Text style={is_dark ? [ styles.navbarSubmit, styles.dark.navbarSubmit ] : styles.navbarSubmit}>Sign Out</Text>
			  </Pressable>
			)
		});		
	}
	
	return (
		<View style={is_dark ? [ styles.container, styles.dark.container ] : styles.container}>
			<View style={is_dark ? [ styles.profilePane, styles.dark.profilePane ] : styles.profilePane}>
				<Image style={styles.profilePhoto} source={{ uri: "https://micro.blog/" + username + "/avatar.jpg" }} />
				<Text style={is_dark ? [ styles.profileUsername, styles.dark.profileUsername ] : styles.profileUsername}>@{username}</Text>
			</View>
			<View style={styles.micropubPane}>
				<Text style={is_dark ? [ styles.micropubHostname, styles.dark.micropubHostname ] : styles.micropubHostname}>Posting to: {hostname}</Text>
				<Pressable style={is_dark ? [ styles.micropubButton, styles.dark.micropubButton ] : styles.micropubButton} onPress={() => { onChangePressed(); }}>
					<Text style={is_dark ? [ styles.micropubButtonTitle, styles.dark.micropubButtonTitle ] : styles.micropubButtonTitle}>Change...</Text>
				</Pressable>
			</View>
		</View>
	);
}
