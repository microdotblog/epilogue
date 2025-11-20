import React from "react";
import { Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import FastImage from "react-native-fast-image";

import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import { Icon } from "../Icon";
import epilogueStorage from "../Storage";
import { keys } from "../Constants";

export function MovieDetailsScreen({ navigation, route }) {
	const styles = useEpilogueStyle();
	const is_dark = (useColorScheme() == "dark");
	const movie = route.params?.movie;

	React.useEffect(() => {
		// const title = movie?.title || "Movie";
		// navigation.setOptions({ title: title });
		setupPostButton(movie?.postText);
	}, [navigation, movie]);

	function setupPostButton(text) {
		navigation.setOptions({
			headerRight: () => (
				<Pressable onPress={() => { startPost(text); }} hitSlop={10}>
					<Icon name="publish" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarNewIcon} accessibilityLabel="new post" />
				</Pressable>
			)
		});
	}

	function startPost(text) {
		epilogueStorage.set(keys.currentTitle, "");
		epilogueStorage.set(keys.currentText, text || "");
		epilogueStorage.set(keys.currentTextExtra, "");
		epilogueStorage.remove(keys.currentPostURL);
		navigation.navigate("Post", { books: [] });
	}

	return (
		<ScrollView style={styles.bookDetailsScroll}>
			<View style={[styles.movieDetails, styles.bookDetailsTop]}>
				{movie?.largeImage ? (
					<FastImage style={styles.movieDetailsPoster} source={{ uri: movie.largeImage }} />
				) : (
					<View style={[styles.movieDetailsPoster, { backgroundColor: "#DEDEDE", borderRadius: 6 }]} />
				)}
				<Text style={styles.bookDetailsTitle}>{movie?.title}</Text>
				{movie?.year ? <Text style={styles.bookDetailsAuthor}>{movie.year}</Text> : null}
				{movie?.director ? <Text style={styles.bookDetailsAuthor}>{movie.director}</Text> : null}
			</View>
			{movie?.overview ? (
				<View style={styles.movieDescription}>
					<Text style={styles.bookDetailsDescription}>{movie.overview}</Text>
				</View>
			) : null}
			{movie?.postText ? (
				<View style={styles.bookDetailsDescription}>
					<Text></Text>
				</View>
			) : null}
		</ScrollView>
	)
}
