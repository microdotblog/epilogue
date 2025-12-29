import React, { useState } from "react";
import { TextInput, Pressable, Text, View, Image, Alert, Linking, Platform, useColorScheme, ActivityIndicator } from "react-native";
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';

import { keys } from "../Constants";
import { useEpilogueStyle } from '../hooks/useEpilogueStyle';
import epilogueStorage from "../Storage";

export function SignInScreen({ navigation }) {
	const styles = useEpilogueStyle();
	const colorScheme = useColorScheme();
	const is_dark = (colorScheme == "dark");
	
	const [ email, setEmail ] = useState();
	const [ emailSent, setEmailSent ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
			!emailSent &&
			  <Pressable onPress={() => { if (!isLoading) { onSendEmail(); } }}>
				<Text style={styles.navbarSubmit}>Sign In</Text>
			  </Pressable>
			),
		});
	}, [navigation, email, emailSent, is_dark, styles, isLoading]);	
	
	if (Platform.OS == "ios") {
		React.useEffect(() => {
			return appleAuth.onCredentialRevoked(async () => {
				console.warn("Credentials revoked");
			});
		}, []);
	}
	
	async function onAppleButtonPress() {
		try {
			setIsLoading(true);
			const appleAuthRequestResponse = await appleAuth.performRequest({
				requestedOperation: appleAuth.Operation.LOGIN,
				requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL]
			});
			
			const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);
			
			if (credentialState === appleAuth.State.AUTHORIZED) {
				const user_id = appleAuthRequestResponse.user;
				const identity_token = appleAuthRequestResponse.identityToken;
				const email = appleAuthRequestResponse.email;
				const full_name = appleAuthRequestResponse.fullName.givenName + " " + appleAuthRequestResponse.fullName.familyName;

				let form = new FormData();
				form.append("user_id", user_id);
				form.append("identity_token", identity_token);
				form.append("email", email);
				form.append("full_name", full_name);
				form.append("app_name", "Epilogue");
				
				var options = {
					method: "POST",
					body: form
				};
				
				fetch("https://micro.blog/account/apple", options).then(response => response.json()).then(data => {
					if (data.error != undefined) {
						Alert.alert(data.error);
						setIsLoading(false);
					}
					else if (data.username.length == 0) {
						epilogueStorage.set(keys.appleUserID, user_id).then(() => {
							epilogueStorage.set(keys.appleIdentityToken, identity_token).then(() => {
								setIsLoading(false);
								navigation.navigate("Username");
							});
						});
					}
					else {
						epilogueStorage.set(keys.authToken, data.token).then(() => {
							setIsLoading(false);
							Linking.openURL("epilogue://signin/" + data.token);
						});
					}
				}).catch(() => {
					setIsLoading(false);
					Alert.alert("Error signing in");
				});
			}
			else {
				setIsLoading(false);
			}
		}
		catch (e) {
			setIsLoading(false);
			Alert.alert("Error signing in");
		}
	}
	
	function onSendEmail() {
		if ((email != undefined) && (email.length > 0)) {
			// allow pasting in an app token
			if (!email.includes("@")) {
				setIsLoading(true);
				epilogueStorage.set(keys.authToken, email).then(() => {
					setIsLoading(false);
					navigation.goBack();
				});
			}
			else {
				setIsLoading(true);
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
					setIsLoading(false);
				}).catch(() => {
					setIsLoading(false);
					Alert.alert("Error signing in");
				});
			}
		}
	}
	
	return (
		<View style={{ flex: 1 }}>
			{ emailSent === false ? (
				<View style={styles.signIn}>
					<View style={styles.signInHeader}>
						<Text style={styles.signInTextHeader}>
							Epilogue is a companion app for Micro.blog. It uses Micro.blog’s bookshelves to help you track which books you are reading or want to read. You can blog directly from Epilogue.
						</Text>
					</View>
					
					<View style={styles.signInContent}>
						<Text style={[styles.signInText, { fontWeight: "500" }]}>
							Enter your Micro.blog account email address and you'll receive a link to sign in:
						</Text>
						<TextInput style={styles.signInInput} value={email} onChangeText={setEmail} onEndEditing={() => { if (!isLoading) { onSendEmail(); } }} returnKeyType="done" placeholder="email@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoFocus={true} />
					
						{ Platform.OS == "ios" &&
							<Text style={styles.signInWithAppleIntro}>Don't have an account? Sign in with your Apple ID:</Text>
						}
						{ Platform.OS == "ios" &&
							<View style={styles.signInWithAppleButton}>
								<AppleButton 
									buttonStyle={
										is_dark ? AppleButton.Style.WHITE : AppleButton.Style.BLACK
									}
									buttonType={AppleButton.Type.SIGN_IN}
									style={{ width: 200, height: 40 }} // Required
									onPress={() => { if (!isLoading) { onAppleButtonPress(); } } }
								/>
							</View>
						}
					</View>
				</View>
				
				
			) : (
				<View style={styles.signIn}>
					<View style={styles.signInContent}>
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
				</View>
			) }
			{ isLoading &&
				<View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.2)" }}>
					<ActivityIndicator size="large" color={is_dark ? "#FFFFFF" : "#000000"} />
				</View>
			}
		</View>
	);
}
