import React, { useState } from "react";
import type { Node } from "react";
import { TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import styles from "./Styles";

export function PostScreen({ navigation }) {
	const [ text, setText ] = useState();
	
	return (
		<View style={styles.postTextBox}>
			<TextInput style={styles.postTextInput} value={text} onChangeText={setText} multiline={true} />
		</View>
	);
}
