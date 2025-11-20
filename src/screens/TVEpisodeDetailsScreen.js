import React from "react";
import { Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import FastImage from "react-native-fast-image";

import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import { Icon } from "../Icon";
import epilogueStorage from "../Storage";
import { keys } from "../Constants";

export function TVEpisodeDetailsScreen({ navigation, route }) {
	const styles = useEpilogueStyle();
	const is_dark = (useColorScheme() == "dark");
	const episode = route.params?.episode;
	const showTitle = route.params?.showTitle;

	React.useEffect(() => {
		const title = episode?.title || "Episode";
		navigation.setOptions({ title: title });
		setupPostButton(episode?.postText);
	}, [navigation, episode]);

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
			<View style={[styles.episodeDetails, styles.bookDetailsTop]}>
				{episode?.image ? (
					<FastImage style={styles.episodeDetailsPoster} source={{ uri: episode.image }} />
				) : (
					<View style={[styles.episodeDetailsPoster, { backgroundColor: "#DEDEDE", borderRadius: 6 }]} />
				)}
				<Text style={styles.bookDetailsTitle}>{episode?.title}</Text>
				{showTitle ? <Text style={styles.bookDetailsAuthor}>{showTitle}</Text> : null}
				{episode?.airDate ? <Text style={styles.bookDetailsAuthor}>{episode.airDate}</Text> : null}
			</View>
			{episode?.postText ? (
				<View style={styles.bookDetailsDescription}>
					<Text></Text>
				</View>
			) : null}
		</ScrollView>
	)
}
