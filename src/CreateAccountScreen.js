
import React, { useState } from "react";
import { View, TextInput, Text, Pressable } from 'react-native';

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";
import { Book } from "./Book";

export function CreateAccountScreen({ navigation }) {		
	const styles = useEpilogueStyle();
	
	const [ username, setUsername ] = useState();
	
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onSendUsername(); }}>
				<Text style={styles.navbarSubmit}>Register</Text>
			  </Pressable>
			),
		});
	}, [navigation, username]);
	
	function onSendUsername() {
		console.log("onSendUsername")
		if ((username != undefined) && (username.length > 0)) {
			let form = new FormData();
			form.append("username", username);
			form.append("app_name", "Epilogue");
		
			var options = {
				method: "POST",
				body: form
			};
		
			fetch("https://micro.blog/account/apple", options).then(response => response.json()).then(data => {
				if (data.error != undefined) {
					console.warn(data.error);
				}
				else {
					epilogueStorage.set(keys.authToken, data.token).then(() => {
						Linking.openURL("epilogue://signin/" + data.token);
					});
				}
			});
		}
	}

	return (
		<View style={styles.signUp}>
			<Text style={[styles.signUpText, { fontWeight: "500" }]}>Pick a username to finish registering your account for Epilogue: </Text>
			
			<TextInput style={styles.signUpInput} value={username} onChangeText={setUsername} returnKeyType="done" placeholder="username" autoCorrect={false} autoFocus={true} autoCapitalize={false} />
			
			<Text style={ [styles.signUpText, { paddingTop: 20}] }>Micro.blog will create a new hosted microblog for you to try.</Text>
			<Text style={ styles.signUpDescription}>Your new microblog includes photo storage, cross-posting to other platforms, a custom domain name, themes, pages, and more. (You can also use Micro.blog for free with an existing blog.)</Text>	

		</View>
	)
}