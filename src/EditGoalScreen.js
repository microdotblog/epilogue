import React, { useState } from "react";
import { Pressable, FlatList, Image, View, TouchableOpacity, Text, TextInput, ActivityIndicator, Platform } from 'react-native';

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";

export function EditGoalScreen({ navigation }) {
	const styles = useEpilogueStyle();
	const [ goalValue, setGoalValue ] = useState();

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
	}

	function onChangeText(text) {
		setGoalValue(text);
		// epilogueStorage.set("current_text", text);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.editGoalTitle}>Set a new reading goal for 2022.</Text>
			<Text style={styles.editGoalDescription}>Micro.blog will update the progress toward your goal when you blog about a book you finished reading.</Text>
			<TextInput style={styles.editGoalInput} value={goalValue} onChangeText={onChangeText} multiline={false} autoFocus={true} />
		</View>
	)
}