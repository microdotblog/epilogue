import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

export function AddBookInfoScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const [ title, setTitle ] = useState("");
	const [ author, setAuthor ] = useState("");
	const [ isbn, setISBN ] = useState(route.params?.isbn || "");
	const [ isSaving, setIsSaving ] = useState(false);

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<Pressable onPress={() => { onAddPressed(); }} disabled={isSaving}>
					<Text style={styles.navbarSubmit}>Add Book</Text>
				</Pressable>
			)
		});
	}, [navigation, title, author, isbn, isSaving, styles]);

	function onAddPressed() {
		if (isSaving) {
			return;
		}

		addBookInfo({
			bookshelf_id: route.params?.bookshelf_id,
			title: title,
			author: author,
			isbn: isbn
		});
	}

	function addBookInfo(bookInfo) {
		const newBookInfo = {
			bookshelf_id: bookInfo.bookshelf_id,
			title: bookInfo.title.trim(),
			author: bookInfo.author.trim(),
			isbn: bookInfo.isbn.trim()
		};

		if (
			newBookInfo.title.length === 0 ||
			newBookInfo.author.length === 0 ||
			newBookInfo.isbn.length === 0
		) {
			Alert.alert("Title, author, and ISBN are required.");
			return;
		}

		const params = new URLSearchParams({
			title: newBookInfo.title,
			author: newBookInfo.author,
			isbn: newBookInfo.isbn
		});

		if (newBookInfo.bookshelf_id != null) {
			params.append("bookshelf_id", newBookInfo.bookshelf_id);
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
					throw new Error("Could not add book.");
				}
				navigation.goBack();
			}).catch(() => {
				setIsSaving(false);
				Alert.alert("Could not add this book.");
			});
		}).catch(() => {
			setIsSaving(false);
			Alert.alert("Could not add this book.");
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
