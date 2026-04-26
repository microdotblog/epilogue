import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { useEpilogueStyle } from "../hooks/useEpilogueStyle";

export function AddBookInfoScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const [ title, setTitle ] = useState("");
	const [ author, setAuthor ] = useState("");
	const [ isbn, setISBN ] = useState(route.params?.isbn || "");

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<Pressable onPress={() => { onAddPressed(); }}>
					<Text style={styles.navbarSubmit}>Add Book</Text>
				</Pressable>
			)
		});
	}, [navigation, title, author, isbn, styles]);

	function onAddPressed() {
		if (!hasRequiredFields()) {
			Alert.alert("Title, author, and ISBN are required.");
			return;
		}

		addBookInfo({
			bookshelf_id: route.params?.bookshelf_id,
			title: title.trim(),
			author: author.trim(),
			isbn: isbn.trim()
		});
	}

	function hasRequiredFields() {
		return (
			title.trim().length > 0 &&
			author.trim().length > 0 &&
			isbn.trim().length > 0
		);
	}

	function addBookInfo(bookInfo) {
		// Placeholder for future POST wiring.
		Alert.alert("Adding a new book is not available yet.");
	}

	return (
		<View style={styles.container}>
			<View style={styles.editBookInfoForm}>
				<Text style={styles.editBookInfoLabel}>Title</Text>
				<TextInput
					style={styles.editBookInfoInput}
					value={title}
					onChangeText={setTitle}
					returnKeyType="next"
					autoCapitalize="sentences"
					autoCorrect={false}
					autoFocus={true}
				/>

				<Text style={styles.editBookInfoLabel}>Author</Text>
				<TextInput
					style={styles.editBookInfoInput}
					value={author}
					onChangeText={setAuthor}
					returnKeyType="next"
					autoCapitalize="words"
					autoCorrect={false}
				/>

				<Text style={styles.editBookInfoLabel}>ISBN</Text>
				<TextInput
					style={styles.editBookInfoInput}
					value={isbn}
					onChangeText={setISBN}
					returnKeyType="done"
					autoCapitalize="none"
					autoCorrect={false}
				/>
			</View>
		</View>
	);
}
