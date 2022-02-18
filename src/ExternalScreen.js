import React, { useState } from "react";
import type { Node } from "react";
import { Linking, Alert, TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { DOMParser } from "@xmldom/xmldom";

import { keys, errors } from "./Constants";
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
		epilogueStorage.get(keys.micropubToken).then(micropub_token => {
			if (micropub_token != undefined) {
				epilogueStorage.set(keys.lastMicropubToken, micropub_token);
			}

			startTokenCheckTimer();
		});
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
	
	function startTokenCheckTimer() {
		setTimeout(checkForNewToken, 1500);
	}
	
	function checkForNewToken() {
		epilogueStorage.get(keys.micropubToken).then(new_token => {
			epilogueStorage.get(keys.lastMicropubToken).then(old_token => {
				if (new_token == undefined) {
					// no new token yet, check again
					startTokenCheckTimer();
				}
				else if (new_token != old_token) {
					// found new token, close screen
					navigation.goBack();
				}
				else {
					// token is the same, keep checking
					startTokenCheckTimer();
				}
			});
		});
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
			
			if (authorization_endpoint.length == 0) {
				Alert.alert(errors.noAuthorizationEndpoint);
				return;
			}
			if (token_endpoint.length == 0) {
				Alert.alert(errors.noTokenEndpoint);
				return;
			}
			if (micropub_endpoint.length == 0) {
				Alert.alert(errors.noMicropubEndpoint);
				return;
			}
			
			epilogueStorage.set(keys.meURL, url);
			epilogueStorage.set(keys.authURL, authorization_endpoint);
			epilogueStorage.set(keys.tokenURL, token_endpoint);
			epilogueStorage.set(keys.micropubURL, micropub_endpoint);			

			epilogueStorage.remove(keys.micropubToken);
			epilogueStorage.remove(keys.currentBlogID);
			epilogueStorage.remove(keys.currentBlogName);
			
			startAuthorization(authorization_endpoint, url);
		});
	}
	
	function startAuthorization(auth_url, me_url) {
		var full_url = auth_url;
		if (full_url.includes("?")) {
			full_url = full_url + "&";
		}
		else {
			full_url = full_url + "?";
		}
		
		// this will redirect with "code" and "state" params
		// on that page, JS will redirect us back to epilogue://indieauth
		let redirect_url = "https://epilogue.micro.blog/indieauth/";		

		// random number for the state
		let state = Math.floor(Math.random() * 100000).toString();
		epilogueStorage.set(keys.authState, state);
		
		full_url = full_url + "response_type=" + "code" + "&";
		full_url = full_url + "client_id=" + encodeURIComponent("https://epilogue.micro.blog/") + "&";
		full_url = full_url + "redirect_uri=" + encodeURIComponent(redirect_url) + "&";
		full_url = full_url + "state=" + state + "&";
		full_url = full_url + "scope=" + "create" + "&";
		full_url = full_url + "me=" + encodeURIComponent(me_url) + "&";
		
		// open in web browser
		Linking.openURL(full_url);		
	}
		
	return (
		<View style={is_dark ? [ styles.container, styles.dark.container ] : styles.container}>
			<Text style={styles.micropubIntro} >Post to an external blog via Micropub:</Text>
			<TextInput style={styles.micropubURL} value={url} onChangeText={setURL} onEndEditing={onSendURL} returnKeyType="done" placeholder="Your blog URL" autoCapitalize="none" autoCorrect={false} autoFocus={true} />
		</View>
	);
}
