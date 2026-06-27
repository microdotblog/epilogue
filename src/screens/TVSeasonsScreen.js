import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View, useColorScheme } from "react-native";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { MOVIE_POSTER_HEIGHT, MOVIE_POSTER_WIDTH } from "../Styles";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Icon } from "../Icon";

export function TVSeasonsScreen({ navigation, route }) {
	const styles = useEpilogueStyle();
	const is_dark = (useColorScheme() == "dark");
	const [ seasons, setSeasons ] = useState([]);
	const [ loading, setLoading ] = useState(true);
	const show = route.params?.movie;
	const tmdbId = show?.tmdbId;

	React.useEffect(() => {
		navigation.setOptions({ title: titleForShow(show?.title) });
		setupPostButton(show?.postText);
	}, [navigation, show]);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			if (tmdbId) {
				loadSeasons(tmdbId);
			}
		});
		return unsubscribe;
	}, [navigation, tmdbId]);

	function loadSeasons(id) {
		setLoading(true);
		epilogueStorage.get(keys.authToken).then(auth_token => {
			var options = {};
			if ((auth_token != null) && (auth_token.length > 0)) {
				options.headers = {
					"Authorization": "Bearer " + auth_token
				};
			}

			fetch("https://micro.blog/movies/discover/" + id, options).then(response => response.json()).then(data => {
				const items = data.items || [];
				const new_seasons = items.map((item, index) => {
					const metadata = item._microblog || {};
					return {
						id: item.id?.toString() || metadata.tmdb_id || (item.title + "-" + index),
						title: item.title,
						image: item.image,
						tmdbId: metadata.tmdb_id || id,
						episodesCount: metadata.episode_count,
						year: metadata.year,
						seasonNumber: metadata.season_number,
						postText: metadata.post_text,
					};
				});
				setSeasons(new_seasons);
				setLoading(false);
			}).catch(() => {
				setLoading(false);
			});
		});
	}

	function titleForShow(title) {
		if (!title) {
			return "Seasons";
		}

		const trimmed_title = title.trim();
		if (trimmed_title.length == 0) {
			return "Seasons";
		}

		const words = trimmed_title.split(/\s+/);
		if (words.length <= 2) {
			return trimmed_title;
		}

		return words.slice(0, 2).join(" ") + "...";
	}

	function setupPostButton(text) {
		navigation.setOptions({
			headerRight: () => (
				<Pressable onPress={() => { startPost(text); }} hitSlop={10}>
					<Icon name="publish" color={is_dark ? "#FFFFFF" : "#000000"} size={18} style={styles.navbarNewIcon} accessibilityLabel="new post" />
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

	function onSelectSeason(item) {
		if (!item) {
			return;
		}
		navigation.navigate("TVEpisodes", {
			showTitle: show?.title,
			seasonTitle: item.title,
			tmdbId: item.tmdbId,
			seasonNumber: item.seasonNumber,
			postText: item.postText || show?.postText
		});
	}

	const renderSeason = ({ item }) => {
		return (
			<Pressable onPress={() => { onSelectSeason(item); }}>
				<View style={{ flexDirection: "row", paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", marginLeft: 5 }}>
					{item.image ? (
						<FastImage style={{ width: MOVIE_POSTER_WIDTH, height: MOVIE_POSTER_HEIGHT, borderRadius: 4, backgroundColor: "#ddd", marginRight: 12 }} source={{ uri: item.image }} />
					) : (
						<View style={{ width: MOVIE_POSTER_WIDTH, height: MOVIE_POSTER_HEIGHT, borderRadius: 4, backgroundColor: "#ddd", marginRight: 12 }} />
					)}
					<View style={{ flex: 1 }}>
						<Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
						{item.year ? <Text style={{ color: "#5f5f5f", marginTop: 2 }}>{item.year}</Text> : null}
						{item.episodesCount ? <Text style={{ color: "#5f5f5f", marginTop: 2 }}>{item.episodesCount} episode{item.episodesCount === 1 ? "" : "s"}</Text> : null}
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
					data={seasons}
					keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
					renderItem={renderSeason}
					ListEmptyComponent={() => (
						<View style={{ padding: 20 }}>
							<Text style={{ textAlign: "center", color: "#5f5f5f" }}>No seasons found.</Text>
						</View>
					)}
				/>
			)}
		</View>
	)
}
