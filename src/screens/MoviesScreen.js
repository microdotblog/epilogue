import React, { useState } from "react";
import { FlatList, Image, Pressable, TextInput, View } from "react-native";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

export function MoviesScreen({ navigation }) {
	const styles = useEpilogueStyle();
	const [ searchText, setSearchText ] = useState("");
	const [ movies, setMovies ] = useState([]);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			setupProfileIcon();
		});
		return unsubscribe;
	}, [navigation]);	

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
		// Placeholder: hook up movie search API here
		setMovies([]);
	}

	return (
		<View style={styles.discoverView}>
			<TextInput style={styles.searchField} value={searchText} onChangeText={onChangeSearch} onEndEditing={onRunSearch} returnKeyType="search" placeholder="Search for movies or TV shows" placeholderTextColor="#6d6d72" clearButtonMode="always" />
			<FlatList
				data={movies}
				keyExtractor={(item, index) => index.toString()}
				renderItem={() => <View />}
			/>
		</View>
	)
}
