import React, { useState } from "react";
import type { Node } from "react";
import { Alert, TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import { keys } from "./Constants";
import styles from "./Styles";
import epilogueStorage from "./Storage";

export function SignInScreen({ navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const [ email, setEmail ] = useState();
	
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		setupSubmitButton();		
	}

	function setupSubmitButton() {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onSendEmail(); }}>
				<Text style={is_dark ? [ styles.navbarSubmit, styles.dark.navbarSubmit ] : styles.navbarSubmit}>Sign In</Text>
			  </Pressable>
			)
		});		
	}
	
	function onSendEmail() {
		if ((email != undefined) && (email.length > 0)) {
			// allow pasting in an app token
			if (!email.includes("?")) {
				epilogueStorage.set(keys.authToken, email).then(() => {
					navigation.goBack();
				});
			}
			else {
				let form = new FormData();
				form.append("email", email);
				form.append("app_name", "Epilogue");
				form.append("redirect_url", "epilogue://signin/");
	
				var options = {
					method: "POST",
					body: form
				};
								
				// setProgressAnimating(true);
			
				fetch("https://micro.blog/account/signin", options).then(response => response.json()).then(data => {
					Alert.alert("Email sent", "Check your email on this device for a link to finish signing in.");
				});
			}
		}
	}
	
	return (
		<View style={is_dark ? [ styles.container, styles.dark.container ] : styles.container}>
			<View>
				<Text style={is_dark ? [ styles.signinIntro, styles.dark.signinIntro ] : styles.signinIntro}>Enter your Micro.blog account email address and you'll receive a link to sign in:</Text>
				<TextInput style={is_dark ? [ styles.signinEmail, styles.dark.signinEmail ] : styles.signinEmail} value={email} onChangeText={setEmail} onEndEditing={onSendEmail} returnKeyType="done" placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
			</View>
			<View style={styles.signinAppleSection}>
				<Text style={is_dark ? [ styles.signinAppleIntro, styles.dark.signinAppleIntro ] : styles.signinAppleIntro}>New to Micro.blog? You can register here by signing in with your Apple ID:</Text>
			</View>
		</View>
	);
}
