import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View, useColorScheme } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import FastImage from "react-native-fast-image";
import { keys } from "../Constants";
import epilogueStorage from "../Storage";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import { Icon } from "../Icon";

export function TVEpisodesScreen({ navigation, route }) {
	const styles = useEpilogueStyle();
	const is_dark = (useColorScheme() == "dark");
	const [ episodes, setEpisodes ] = useState([]);
	const [ loading, setLoading ] = useState(true);

	const tmdbId = route.params?.tmdbId;
	const seasonNumber = route.params?.seasonNumber;
	const showTitle = route.params?.showTitle;
	const seasonTitle = route.params?.seasonTitle;
	const postText = route.params?.postText;

	useFocusEffect(
		React.useCallback(() => {
			const title = seasonTitle || showTitle || "Episodes";
			navigation.setOptions({ title: title });
			setupPostButton(postText);

			if (tmdbId && seasonNumber != null) {
				loadEpisodes(tmdbId, seasonNumber);
			}
		}, [navigation, postText, seasonNumber, seasonTitle, showTitle, tmdbId, is_dark, styles])
	);

	function loadEpisodes(id, season) {
		setLoading(true);
		epilogueStorage.get(keys.authToken).then(auth_token => {
			var options = {};
			if ((auth_token != null) && (auth_token.length > 0)) {
				options.headers = {
					"Authorization": "Bearer " + auth_token
				};
			}

			fetch("https://micro.blog/movies/discover/" + id + "/seasons/" + season, options).then(response => response.json()).then(data => {
				const items = data.items || [];
				const new_episodes = items.map((item, index) => {
					const metadata = item._microblog || {};
					return {
						id: item.id?.toString() || metadata.tmdb_id || (item.title + "-" + index),
						title: item.title,
						image: item.image,
						largeImage: metadata.large_still_url || item.image,
						airDate: metadata.air_date,
						url: metadata.url,
						tmdbId: metadata.tmdb_id || id,
						postText: metadata.post_text,
						overview: metadata.overview,
					};
				});
				setEpisodes(new_episodes);
				setLoading(false);
			}).catch(() => {
				setLoading(false);
			});
		});
	}

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

	function onSelectEpisode(item) {
		if (!item) {
			return;
		}
		navigation.navigate("TVEpisodeDetails", {
			episode: item,
			showTitle: showTitle
		});
	}

	const renderEpisode = ({ item }) => {
		return (
			<Pressable onPress={() => { onSelectEpisode(item); }}>
				<View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", marginLeft: 5 }}>
					{item.image ? (
						<FastImage style={{ width: 80, height: 50, borderRadius: 4, backgroundColor: "#ddd", marginRight: 12 }} source={{ uri: item.image }} />
					) : (
						<View style={{ width: 80, height: 50, borderRadius: 4, backgroundColor: "#ddd", marginRight: 12 }} />
					)}
					<View style={{ flex: 1 }}>
						<Text style={{ fontWeight: "600", fontSize: 14 }} numberOfLines={2}>{item.title}</Text>
						{item.airDate ? <Text style={{ color: "#5f5f5f", marginTop: 2 }}>{item.airDate}</Text> : null}
					</View>
				</View>
			</Pressable>
		);
	};

	return (
		<View style={styles.discoverView}>
			{loading ? (
				<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
					<ActivityIndicator size="small" />
				</View>
			) : (
				<FlatList
					data={episodes}
					keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
					renderItem={renderEpisode}
					ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eee", marginLeft: 88 }} />}
					ListEmptyComponent={() => (
						<View style={{ padding: 20 }}>
							<Text style={{ textAlign: "center", color: "#5f5f5f" }}>No episodes found.</Text>
						</View>
					)}
				/>
			)}
		</View>
	)
}
