import React, { useState } from "react";
import type { Node } from "react";
import { TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import styles from "./Styles";
import epilogueStorage from "./Storage";

export function SignInScreen({ navigation }) {
	const [ email, setEmail ] = useState();
	
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
	}
	
	return (
		<View style={styles.container}>
			<View>
				<Text style={styles.signinIntro}>Enter your Micro.blog account email address and you'll receive a link to sign in:</Text>
				<TextInput style={styles.signinEmail} value={email} onChangeText={setEmail} placeholder="Email address" />
			</View>
			<View style={styles.signinAppleSection}>
				<Text style={styles.signinAppleIntro}>New to Micro.blog? You can register here by signing in with your Apple ID:</Text>
			</View>
		</View>
	);
}
