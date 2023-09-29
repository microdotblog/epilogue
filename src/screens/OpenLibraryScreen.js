import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, FlatList, StyleSheet, Text, View, TextInput } from "react-native";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

export function OpenLibraryScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const [ username, setUsername ] = useState();
	const [ password, setPassword ] = useState();
	const [ hasSession, setHasSession ] = useState(false);
	const [ isSigningIn, setIsSigningIn ] = useState(false);
    const passwordRef = useRef();

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
	
	function onNextField() {
		passwordRef.current.focus();
	}

	function onSubmitSignin() {
		if (password.length == 0) {
			return;
		}

		console.log("signing in");		
		setIsSigningIn(true);
		
		let form = new FormData();
		form.append("username", username);
		form.append("password", password);
		
		var options = {
			method: "POST",
			body: form,
			cache: "no-cache",
			redirect: "manual",
			credentials: "omit"
		};
		fetch("https://openlibrary.org/account/login", options).then(response => {
			console.log("got response", response.status, response.headers);
			response.text().then(html => {
				console.log(html);
			});
			if (response.headers.has("Set-Cookie")) {
				const value = response.headers.get("Set-Cookie");
				console.log("cookie", value);
			}
			
			setIsSigningIn(false);
		});
	}
	
	function onShowProfile() {
		navigation.navigate("Profile");
	}	
	return (
		<View style={styles.container}>		
			<View style={styles.openLibraryBanner}>
				<Text style={styles.openLibraryIntro}>Sign in with an account on the Internet Archive's Open Library to update book info and covers. Everyone using Open Library or Epilogue will be able to use your book covers.</Text>
			</View>
			{ !hasSession && 
				<View style={styles.openLibrarySignin}>
					<TextInput style={styles.openLibraryUsername} value={username} onChangeText={setUsername} onEndEditing={onNextField} returnKeyType="next" placeholder="Username" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoFocus={true} />
					<TextInput style={styles.openLibraryPassword} value={password} onChangeText={setPassword} onEndEditing={onSubmitSignin} returnKeyType="done" placeholder="Password" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoFocus={true} secureTextEntry={true} ref={passwordRef} />
					{ isSigningIn &&
						<ActivityIndicator style={styles.openLibrarySigninSpinner} animating={isSigningIn} hidesWhenStopped={true} />
					}				
				</View>
			}
		</View>
	)
}