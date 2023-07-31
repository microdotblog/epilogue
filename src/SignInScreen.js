import React, { useState } from "react";
import { TextInput, Pressable, Text, View, Image, Alert, Linking, useColorScheme } from "react-native";
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";

export function SignInScreen({ navigation }) {
	const styles = useEpilogueStyle();
	const is_dark = (useColorScheme() == "dark");
	
	const [ email, setEmail ] = useState();
	const [ emailSent, setEmailSent ] = useState(false);

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
			!emailSent &&
			  <Pressable onPress={() => { onSendEmail(); }}>
				<Text style={styles.navbarSubmit}>Sign In</Text>
			  </Pressable>
			),
		});
	}, [navigation, email, emailSent]);	
	
	React.useEffect(() => {
		return appleAuth.onCredentialRevoked(async () => {
			console.warn("Credentials revoked");
		});
	}, []);
	
	async function onAppleButtonPress() {
		const appleAuthRequestResponse = await appleAuth.performRequest({
			requestedOperation: appleAuth.Operation.LOGIN,
			requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL]
		});
		
		const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);
		
		if (credentialState === appleAuth.State.AUTHORIZED) {
			// authorized
			const user_id = appleAuthRequestResponse.user;
			const identity_token = appleAuthRequestResponse.identityToken;
			const email = appleAuthRequestResponse.email;
			const full_name = appleAuthRequestResponse.fullName.givenName + " " + appleAuthRequestResponse.fullName.familyName;

			let form = new FormData();
			form.append("user_id", user_id);
			form.append("identity_token", identity_token);
			form.append("email", email);
			form.append("full_name", full_name);
			
			var options = {
				method: "POST",
				body: form
			};
			
			fetch("https://micro.blog/account/apple", options).then(response => response.json()).then(data => {
				console.log("data:", data);
				if (data.error != undefined) {
					// error signing in
					Alert.alert(data.error);
				}
				else if (data.username.length == 0) {
					// created an account, now pick a username
					navigation.navitate("Username");
				}
				else {
					// user already has an account
					epilogueStorage.set(keys.authToken, data.token).then(() => {
						Linking.openURL("epilogue://signin/" + data.token);
					});
				}
			});
		}
	}
	
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
			<View style={styles.signIn}>
				<View style={styles.signInHeader}>
					<Image style={styles.signInImage} source={require("../images/welcome-logo.png")} />
					<Text style={styles.signInTextHeader}>
						Epilogue is a companion app for Micro.blog. It uses Micro.blog’s bookshelves to help you track which books you are reading or want to read. You can blog directly from Epilogue.
					</Text>
				</View>
				<Text style={[styles.signInText, { fontWeight: "500" }]}>
					Enter your Micro.blog account email address and you'll receive a link to sign in:
				</Text>
				<TextInput style={styles.signInInput} value={email} onChangeText={setEmail} onEndEditing={onSendEmail} returnKeyType="done" placeholder="email@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoFocus={true} />
			
			
				<View style={styles.signInWithAppleButton}>
					<AppleButton 
						buttonStyle={
							is_dark ? AppleButton.Style.WHITE : AppleButton.Style.BLACK
						}
						buttonType={AppleButton.Type.SIGN_IN}
						style={ {width: 240, height: 45 }} // Required
						onPress={() => onAppleButtonPress() }
					/>
				</View>
			</View>
			
			
		) : (
			<View style={styles.signIn}>
				<View style={styles.signInHeader}>
					<Image style={styles.signInImage} source={require("../images/welcome-logo.png")} />
				</View>
				<Text style={styles.signInText}>
					We sent an email to: <Text style={{ fontWeight: "600" }}>{email}</Text>
				</Text>
				<Text style={styles.signInText}>
					Check your email on this device for a link to finish signing in.
				</Text>
				<Pressable onPress={() => { setEmailSent(false); setEmail(undefined); }}>
					<Text style={styles.signInLink}>Try a different email</Text>
				</Pressable>
			</View>
		)
	);
}
