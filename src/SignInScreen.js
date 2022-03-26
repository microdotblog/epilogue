import React, { useState } from "react";
import { Button, TextInput, useColorScheme, Pressable, Text, View, ScrollView, Image } from "react-native";

import { keys } from "./Constants";
import styles from "./Styles";
import epilogueStorage from "./Storage";

export function SignInScreen({ navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const [ email, setEmail ] = useState();
	const [ emailSent, setEmailSent ] = useState(false);

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
			!emailSent &&
			  <Pressable onPress={() => { onSendEmail(); }}>
				<Text style={is_dark ? [ styles.navbarSubmit, styles.dark.navbarSubmit ] : styles.navbarSubmit}>Sign In</Text>
			  </Pressable>
			),
		});
	}, [navigation, email, emailSent]);
	
	function onSendEmail() {
		if ((email != undefined) && (email.length > 0)) {
			// allow pasting in an app token
			if (!email.includes("@")) {
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
			
				fetch("https://micro.blog/account/signin", options).then(response => response.json()).then(data => {
					setEmailSent(true);
				});
			}
		}
	}
	
	return (
		emailSent === false ? (
			<View style={is_dark ? [styles.signIn, styles.dark.signIn] : styles.signIn}>
				<View style={styles.signInHeader}>
					<Image style={styles.signInImage} source={require("../images/welcome-logo.png")} />
					<Text style={is_dark ? [styles.signInTextHeader, styles.dark.signInText] : styles.signInTextHeader}>
						Epilogue is a companion app for Micro.blog. It uses Micro.blog’s bookshelves to help you track which books you are reading or want to read. You can blog directly from Epilogue.
					</Text>
				</View>
				<Text style={is_dark ? [styles.signInText, styles.dark.signInText, { fontWeight: "500" }] : [styles.signInText, { fontWeight: "500" }]}>
					Enter your Micro.blog account email address and you'll receive a link to sign in:
				</Text>
				<TextInput style={is_dark ? [styles.signInInput, styles.dark.signInInput] : styles.signInInput} value={email} onChangeText={setEmail} onEndEditing={onSendEmail} returnKeyType="done" placeholder="email@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoFocus={true} />
			</View>
		) : (
			<View style={is_dark ? [styles.signIn, styles.dark.signIn] : styles.signIn}>
				<View style={styles.signInHeader}>
					<Image style={styles.signInImage} source={require("../images/welcome-logo.png")} />
				</View>
				<Text style={is_dark ? [styles.signInText, styles.dark.signInText] : styles.signInText}>
					We sent an email to: <Text style={{ fontWeight: "600" }}>{email}</Text>
				</Text>
				<Text style={is_dark ? [styles.signInText, styles.dark.signInText] : styles.signInText}>
					Check your email on this device for a link to finish signing in.
				</Text>
				<Pressable onPress={() => { setEmailSent(false); setEmail(undefined); }}>
					<Text style={styles.signInLink}>Try a different email</Text>
				</Pressable>
			</View>
		)
	);
}
