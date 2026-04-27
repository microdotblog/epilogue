import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from "react-native";
import { MenuView } from "@react-native-menu/menu";
import RNFS from "react-native-fs";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Icon } from "../Icon";

const latestBooksCachePath = RNFS.CachesDirectoryPath + "/LatestBooks.json";

export function AddBookInfoScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const is_dark = (useColorScheme() == "dark");
	const [ title, setTitle ] = useState("");
	const [ author, setAuthor ] = useState("");
	const [ isbn, setISBN ] = useState(route.params?.isbn || "");
	const [ bookshelves, setBookshelves ] = useState([]);
	const [ bookshelfID, setBookshelfID ] = useState(route.params?.bookshelf_id);
	const [ bookshelfTitle, setBookshelfTitle ] = useState(route.params?.bookshelf_title || "");
	const [ isSaving, setIsSaving ] = useState(false);

	React.useEffect(() => {
		if (route.params?.bookshelf_id == null) {
			return;
		}

		epilogueStorage.get(keys.allBookshelves).then(saved_bookshelves => {
			const new_bookshelves = saved_bookshelves || [];
			const current_bookshelf = new_bookshelves.find(item => item.id == route.params.bookshelf_id);

			setBookshelves(new_bookshelves);
			if (current_bookshelf != undefined) {
				setBookshelfID(current_bookshelf.id);
				setBookshelfTitle(current_bookshelf.title);
			}
		});
	}, [route.params?.bookshelf_id, route.params?.bookshelf_title]);

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
			bookshelf_id: bookshelfID,
			title: title,
			author: author,
			isbn: isbn
		});
	}

	function onBookshelfPressed(shelf_id) {
		const new_bookshelf = bookshelves.find(item => item.id == shelf_id);
		if (new_bookshelf != undefined) {
			setBookshelfID(new_bookshelf.id);
			setBookshelfTitle(new_bookshelf.title);
		}
	}

	function bookshelfMenuActions() {
		return bookshelves.map(item => ({
			id: item.id.toString(),
			title: item.title
		}));
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
				RNFS.unlink(latestBooksCachePath).catch(() => {
				}).then(() => {
					navigation.goBack();
				});
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
		<ScrollView style={styles.container}>
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

				{ bookshelfID != null && bookshelfTitle.length > 0 &&
					<>
						<Text style={styles.editBookInfoLabel}>Bookshelf</Text>
						<MenuView
							accessibilityLabel={bookshelfTitle}
							onPressAction={({ nativeEvent }) => {
								onBookshelfPressed(nativeEvent.event);
							}}
							actions={bookshelfMenuActions()}
						>
							<Pressable style={styles.editBookInfoPicker}>
								<Text style={styles.editBookInfoPickerText}>{bookshelfTitle}</Text>
								<Icon name="popup-triangle" color={is_dark ? "#FFFFFF" : "#000000"} size={12} />
							</Pressable>
						</MenuView>
					</>
				}
			</View>
		</ScrollView>
	);
}
