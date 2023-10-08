import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, StyleSheet, Text, View } from "react-native";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Book } from "../Book";

export function OpenDetailsScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const { title, isbn, image } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	const onFocus = (navigation) =>  {
	}
	
	return (
		<View style={[styles.container, styles.openLibraryEditionsScreen]}>
			<View style={styles.openLibraryEditionsBar}>
				<Text style={styles.openLibraryEditionsTitle}>{title}</Text>
				<Text style={styles.openLibraryEditionsExtras}>{isbn}</Text>
			</View>
			<View style={styles.openLibraryEditionsDetails}>
				<FastImage style={styles.openLibraryEditionsCover} source={{ uri: image.replace("http://", "https://") }} />
			</View>
		</View>
	);
}