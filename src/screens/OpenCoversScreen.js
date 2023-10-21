import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, StyleSheet, Text, View, useColorScheme } from "react-native";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Book } from "../Book";
import { Icon } from "../Icon";

export function OpenCoversScreen({ route, navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const styles = useEpilogueStyle();
	const [ isUploading, setIsUploading ] = useState(false);
	const { title, isbn, image, work_key, edition_key } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	const onFocus = (navigation) =>  {
	}
	
	return (
		<View style={[styles.container]}>
			<Text>Covers!</Text>
		</View>
	);
}