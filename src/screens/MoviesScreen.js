import React, { useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, Text, TextInput, View } from "react-native";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

export function MoviesScreen({ navigation }) {
	const styles = useEpilogueStyle();
	const [ searchText, setSearchText ] = useState("");
	const [ movies, setMovies ] = useState([]);
	const [ loading, setLoading ] = useState(true);
	const [ searching, setSearching ] = useState(false);
	const [ hideCredits, setHideCredits ] = useState(false);
	const hideCreditsTimeout = useRef(null);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			setupProfileIcon();
			setLoading(false);
			setSearching(false);
			// fetchDiscover();
		});
		return unsubscribe;
	}, [navigation]);

	React.useEffect(() => {
		return () => {
			if (hideCreditsTimeout.current) {
				clearTimeout(hideCreditsTimeout.current);
			}
		};
	}, []);

	function setupProfileIcon() {
		epilogueStorage.get(keys.currentUsername).then(username => {
			let avatar_url = "https://micro.blog/" + username + "/avatar.jpg";
			navigation.setOptions({
				headerLeft: () => (
					<Pressable onPress={() => { onShowProfile(); }} accessibilityRole="button" accessibilityLabel="show profile">
						<Image style={styles.profileIcon} source={{ uri: avatar_url }} />
					</Pressable>
				)
			});		
		});
	}

	function onShowProfile() {
		navigation.navigate("Profile");
	}

	function onChangeSearch(text) {
		setSearchText(text);
	}

	function onRunSearch() {
		let s = searchText.trim();
		if (s.length === 0) {
			// fetchDiscover();
			clearResults();
			return;
		}
		if (s.length <= 2) {
			return;
		}
		fetchSearch(s);
	}

	function clearResults() {
		setLoading(false);
		setSearching(false);
		setMovies([]);
	}

	function fetchDiscover() {
		setLoading(true);
		setSearching(false);
		epilogueStorage.get(keys.authToken).then(auth_token => {
			var options = {};
			if ((auth_token != null) && (auth_token.length > 0)) {
				options.headers = {
					"Authorization": "Bearer " + auth_token
				};
			}

			fetch("https://micro.blog/movies/discover", options).then(response => response.json()).then(data => {
				const items = data.items || [];
				const new_movies = items.map((item, index) => {
					const metadata = item._microblog || {};
					const first_author = (item.authors && item.authors.length > 0) ? item.authors[0] : {};
					return {
						id: item.id?.toString() || item.url || (item.title + "-" + index),
						title: item.title,
						image: item.image,
						url: item.url,
						username: first_author._microblog ? first_author._microblog.username : null,
						year: metadata.year,
						director: metadata.director,
						seasonsCount: metadata.seasons_count,
						tmdbId: metadata.tmdb_id,
						overview: metadata.overview,
					};
				});
				setMovies(new_movies);
				setLoading(false);
			}).catch(() => {
				setLoading(false);
			});
		});
	}

	function fetchSearch(query) {
		setSearching(true);
		setLoading(true);
		epilogueStorage.get(keys.authToken).then(auth_token => {
			var options = {};
			if ((auth_token != null) && (auth_token.length > 0)) {
				options.headers = {
					"Authorization": "Bearer " + auth_token
				};
			}
			const params = new URLSearchParams({ q: query }).toString();
			fetch("https://micro.blog/movies/search?" + params, options).then(response => response.json()).then(data => {
				const items = data.items || [];
				const new_movies = items.map((item, index) => {
					const metadata = item._microblog || {};
					return {
						id: item.id?.toString() || metadata.tmdb_id || (item.title + "-" + index),
						title: item.title,
						image: item.image,
						largeImage: metadata.large_poster_url || item.image,
						year: metadata.year,
						director: metadata.director,
						seasonsCount: metadata.seasons_count,
						tmdbId: metadata.tmdb_id,
						postText: metadata.post_text,
						overview: metadata.overview,
					};
				});
				setMovies(new_movies);
				setLoading(false);
				setSearching(false);
			}).catch(() => {
				setLoading(false);
				setSearching(false);
			});
		});
	}

	function onSelectMovie(item) {
		if ((item.seasonsCount != null) && (item.seasonsCount > 0)) {
			navigation.navigate("TVSeasons", { movie: item });
		}
		else {
			navigation.navigate("MovieDetails", { movie: item });
		}
	}

	const renderMovie = ({ item }) => {
		return (
			<Pressable onPress={() => { onSelectMovie(item); }}>
				<View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, alignItems: "center", marginLeft: 5 }}>
					{item.image ? (
						<FastImage style={{ width: 60, height: 90, borderRadius: 4, backgroundColor: "#ddd", marginRight: 12 }} source={{ uri: item.image }} />
					) : (
						<View style={{ width: 60, height: 90, borderRadius: 4, backgroundColor: "#ddd", marginRight: 12 }} />
					)}
					<View style={{ flex: 1 }}>
						<Text style={{ fontWeight: "600", fontSize: 14 }} numberOfLines={2}>{item.title}</Text>
						{item.username ? <Text style={{ color: "#5f5f5f", marginTop: 2 }}>@{item.username}</Text> : null}
						{item.year ? <Text style={{ color: "#5f5f5f", marginTop: 2 }}>{item.year}</Text> : null}
						{item.seasonsCount > 0 ? <Text style={{ color: "#5f5f5f", marginTop: 2 }}>{item.seasonsCount} season{item.seasonsCount === 1 ? "" : "s"}</Text> : null}
					</View>
				</View>
			</Pressable>
		);
	};

	return (
		<View style={styles.discoverView}>
			<TextInput style={styles.searchField} value={searchText} onChangeText={onChangeSearch} onEndEditing={onRunSearch} onFocus={() => {
				if (hideCreditsTimeout.current) {
					clearTimeout(hideCreditsTimeout.current);
				}
				hideCreditsTimeout.current = setTimeout(() => setHideCredits(true), 1000);
			}} returnKeyType="search" placeholder="Search for movies or TV shows" placeholderTextColor="#6d6d72" clearButtonMode="always" />
			<View style={{ flex: 1 }}>
				{loading ? (
					<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
						<ActivityIndicator size="small" />
					</View>
				) : (
					<FlatList
						data={movies}
						keyExtractor={(item, index) => item.id ?? index.toString()}
						renderItem={renderMovie}
						ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eee", marginLeft: 88 }} />}
						ListEmptyComponent={() => (
							<View style={{ padding: 20 }}>
								<Text style={{ textAlign: "center", color: "#5f5f5f" }}>{searching ? "Searching..." : ""}</Text>
							</View>
						)}
					/>
				)}
			</View>
			{hideCredits ? null : (
				<View style={styles.moviesCreditPane}>
					<Image style={styles.moviesCreditImage} source={require("../../images/tmdb.png")} />
					<Text style={styles.moviesCreditText}>Micro.blog and Epilogue use TMDB but are not endorsed, certified, or otherwise approved by TMDB.</Text>
				</View>
			)}
		</View>
	)
}
