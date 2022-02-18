import React, { useState } from "react";
import type { Node } from "react";
import { Alert, TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { DOMParser } from "@xmldom/xmldom";

import { keys } from "./Constants";
import styles from "./Styles";
import epilogueStorage from "./Storage";

export function ExternalScreen({ navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const [ url, setURL ] = useState();
	
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
	}
	
	function onSendURL() {
		var new_url = url;
		if (new_url.length > 0) {
			if (!new_url.includes("http")) {
				new_url = "https://" + new_url;
			}
			
			checkForEndpoints(new_url);
		}
	}
	
	function checkForEndpoints(url) {
		fetch(url).then(data => data.text()).then(html => {
			var authorization_endpoint = "";
			var token_endpoint = "";
			var micropub_endpoint = "";
			
			let parser = new DOMParser();
			let doc = parser.parseFromString(html, "text/html");
			let links = doc.getElementsByTagName("link");
			for (let i = 0; i < links.length; i++) {
				let link = links[i];
				let rel = link.getAttribute("rel");
				let href = link.getAttribute("href");

				if (rel == "authorization_endpoint") {
					authorization_endpoint = href;
				}
				if (rel == "token_endpoint") {
					token_endpoint = href;
				}
				if (rel == "micropub") {
					micropub_endpoint = href;
				}
			}
			
			console.log("got auth: " + authorization_endpoint);
			console.log("got token: " + token_endpoint);
			console.log("got micropub: " + micropub_endpoint);
		});
	}
	
	return (
		<View style={is_dark ? [ styles.container, styles.dark.container ] : styles.container}>
			<Text style={styles.micropubIntro} >Post to an external blog via Micropub:</Text>
			<TextInput style={styles.micropubURL} value={url} onChangeText={setURL} onEndEditing={onSendURL} returnKeyType="done" placeholder="Your blog URL" autoCapitalize="none" autoCorrect={false} autoFocus={true} />
		</View>
	);
}
