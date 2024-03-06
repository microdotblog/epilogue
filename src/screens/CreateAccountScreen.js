
import React, { useState } from "react";
import { View, TextInput, Text, Pressable, Alert, Linking } from 'react-native';

import { keys } from "../Constants";
import { useEpilogueStyle } from '../hooks/useEpilogueStyle';
import epilogueStorage from "../Storage";
import { Book } from "../models/Book";

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
		if ((username != undefined) && (username.length > 0)) {
			epilogueStorage.get(keys.appleUserID).then(user_id => {
				epilogueStorage.get(keys.appleIdentityToken).then(identity_token => {
					// save new username for the account
					let form = new FormData();
					form.append("username", username);
					form.append("user_id", user_id);
					form.append("identity_token", identity_token);
					form.append("app_name", "Epilogue");
					
					var options = {
						method: "POST",
						body: form
					};
					
					fetch("https://micro.blog/account/apple", options).then(response => response.json()).then(data => {
						if (data.error != undefined) {
							Alert.alert(data.error);
						}
						else {
							epilogueStorage.set(keys.authToken, data.token).then(() => {
								Linking.openURL("epilogue://signin/" + data.token);
							});
						}
					});
				});
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