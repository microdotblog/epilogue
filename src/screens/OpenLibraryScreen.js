import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, FlatList, StyleSheet, Text, View, TextInput } from "react-native";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

export function OpenLibraryScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const [ username, setUsername ] = useState("");
	const [ password, setPassword ] = useState("");
	const [ hasSession, setHasSession ] = useState(false);
	const [ isSigningIn, setIsSigningIn ] = useState(false);
	const [ sessionToken, setSessionToken ] = useState("");
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
			body: form
		};
		fetch("https://micro.blog/books/openlibrary/signin", options).then(response => response.json()).then(data => {
			var new_session = data["session"];
			console.log("Got session", new_session);
			
			setIsSigningIn(false);
			
			if (new_session.length > 0) {
				setSessionToken(new_session);
				setHasSession(true);
			}
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
			{ hasSession && 
				<View style={styles.openLibrarySession}>
					<View style={styles.openLibraryStatusBar}>
						<Text style={styles.openLibraryStatusUsername}>Signed in as: {username}</Text>
						<Pressable style={styles.micropubButton} onPress={() => { console.log("sign out") }}>
							<Text style={styles.micropubButtonTitle}>Sign Out</Text>
						</Pressable>
					</View>
					<TextInput style={[ styles.searchField, styles.openLibrarySearch ]} placeholder="Search for books to edit" />
				</View>
			}
		</View>
	)
}