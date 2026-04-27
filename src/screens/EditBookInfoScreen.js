import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import RNFS from "react-native-fs";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

const latestBooksCachePath = RNFS.CachesDirectoryPath + "/LatestBooks.json";

export function EditBookInfoScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const [ title, setTitle ] = useState(route.params?.title || "");
	const [ author, setAuthor ] = useState(route.params?.author || "");
	const [ isbn, setISBN ] = useState(route.params?.isbn || "");
	const [ isSaving, setIsSaving ] = useState(false);

	React.useLayoutEffect(() => {
		navigation.setOptions({
				headerRight: () => (
					<Pressable onPress={() => { onSavePressed(); }} disabled={isSaving}>
						<Text style={styles.navbarSubmit}>Update Book</Text>
					</Pressable>
				)
		});
	}, [navigation, title, author, isbn, isSaving, styles]);

	function onSavePressed() {
		if (isSaving) {
			return;
		}

		saveBookInfo({
			id: route.params?.id,
			title: title,
			author: author,
			isbn: isbn
		});
	}

	function saveBookInfo(bookInfo) {
		const updatedBookInfo = {
			id: bookInfo.id,
			title: bookInfo.title.trim(),
			author: bookInfo.author.trim(),
			isbn: bookInfo.isbn.trim()
		};

		if (
			updatedBookInfo.title.length === 0 ||
			updatedBookInfo.author.length === 0 ||
			updatedBookInfo.isbn.length === 0
		) {
			Alert.alert("Title, author, and ISBN are required.");
			return;
		}

		const params = new URLSearchParams({
			title: updatedBookInfo.title,
			author: updatedBookInfo.author,
			isbn: updatedBookInfo.isbn
		});

		if (updatedBookInfo.id != null) {
			params.append("id", updatedBookInfo.id);
		}

		setIsSaving(true);

		epilogueStorage.get(keys.authToken).then(auth_token => {
			const options = {
				method: "POST",
				body: params.toString(),
				headers: {
					"Authorization": "Bearer " + auth_token,
					"Content-Type": "application/x-www-form-urlencoded"
				}
			};

			fetch("https://micro.blog/books", options).then(response => {
				if (!response.ok) {
					throw new Error("Could not update book.");
				}
				RNFS.unlink(latestBooksCachePath).catch(() => {
				}).then(() => {
					navigation.goBack();
				});
			}).catch(() => {
				setIsSaving(false);
				Alert.alert("Could not update this book.");
			});
		}).catch(() => {
			setIsSaving(false);
			Alert.alert("Could not update this book.");
		});
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
