import React, { useState, useRef } from "react";
import { Pressable, FlatList, Image, View, TouchableOpacity, Text, TextInput, ActivityIndicator, Platform } from 'react-native';

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";

export function EditGoalScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const [ goalValue, setGoalValue ] = useState();
	const inputRef = useRef();
	const { id, name, year } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		setupUpdateButton();
	}

	function setupUpdateButton() {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onUpdateValue(); }}>
				<Text style={styles.navbarSubmit}>Update</Text>
			  </Pressable>
			)
		});
	}

	function onUpdateValue() {
		let new_value = inputRef.current.value;

		let form = new FormData();
		form.append("value", new_value);
						
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				method: "POST",
				body: form,
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};

			let url = "https://micro.blog/books/goals/" + id;
			fetch(url, options).then(response => response.json()).then(data => {
				navigation.goBack();
			});
		});
	}

	function onChangeText(text) {
		setGoalValue(text);
		inputRef.current.value = text;
	}

	return (
		<View style={styles.container}>
			<Text style={styles.editGoalTitle}>Set a new reading goal for {year}.</Text>
			<Text style={styles.editGoalDescription}>Micro.blog will update the progress toward your goal when you blog about a book you finished reading.</Text>
			<TextInput style={styles.editGoalInput} value={goalValue} onChangeText={onChangeText} multiline={false} autoFocus={true} keyboardType={"number-pad"} ref={inputRef} />
		</View>
	)
}