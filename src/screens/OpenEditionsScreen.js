import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, FlatList, StyleSheet, Text, View, TextInput } from "react-native";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Book } from "../Book";

export function OpenEditionsScreen({ route, navigation }) {
	const styles = useEpilogueStyle();

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	const onFocus = (navigation) =>  {
	}

	return (
		<View style={styles.container}>
		</View>
	);
}