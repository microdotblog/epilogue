import React, { useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import FastImage from "react-native-fast-image";
import { keys } from "../Constants";
import epilogueStorage from "../Storage";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";

export function TVEpisodesScreen({ navigation, route }) {
	const styles = useEpilogueStyle();
	const [ episodes, setEpisodes ] = useState([]);
	const [ loading, setLoading ] = useState(true);

	const tmdbId = route.params?.tmdbId;
	const seasonNumber = route.params?.seasonNumber;
	const showTitle = route.params?.showTitle;
	const seasonTitle = route.params?.seasonTitle;

	React.useEffect(() => {
		const title = seasonTitle || showTitle || "Episodes";
		navigation.setOptions({ title: title });
	}, [navigation, showTitle, seasonTitle]);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			if (tmdbId && seasonNumber != null) {
				loadEpisodes(tmdbId, seasonNumber);
			}
		});
		return unsubscribe;
	}, [navigation, tmdbId, seasonNumber]);

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
						airDate: metadata.air_date,
						url: metadata.url,
						tmdbId: metadata.tmdb_id || id,
					};
				});
				setEpisodes(new_episodes);
				setLoading(false);
			}).catch(() => {
				setLoading(false);
			});
		});
	}

	const renderEpisode = ({ item }) => {
		return (
			<View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, alignItems: "center" }}>
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
