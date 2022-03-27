import React, { useState } from "react";
import type { Node } from "react";
import { Alert, TextInput, ActivityIndicator, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";

export function ProfileScreen({ navigation }) {
	const styles = useEpilogueStyle()
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
			  	<Text style={styles.navbarSubmit}>Sign Out</Text>
			  </Pressable>
			)
		});		
	}
	
	return (
		<View style={styles.container}>
			<View style={styles.profilePane}>
				<Image style={styles.profilePhoto} source={{ uri: "https://micro.blog/" + username + "/avatar.jpg" }} />
				<Text style={styles.profileUsername}>@{username}</Text>
			</View>
			<View style={styles.micropubPane}>
				<Text style={styles.micropubHostname}>Posting to: {hostname}</Text>
				<Pressable style={styles.micropubButton} onPress={() => { onChangePressed(); }}>
					<Text style={styles.micropubButtonTitle} accessibilityLabel="change posting blog">Change...</Text>
				</Pressable>
			</View>
		</View>
	);
}
