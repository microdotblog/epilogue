import React, { useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";

import { booksFromJSONFeed, readBookshelfIDsContainingBook } from "../BookshelfCache";
import { keys } from "../Constants";
import { Icon } from "../Icon";
import epilogueStorage from "../Storage";

export function AuthorBooksScreen({ route, navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const [ books, setBooks ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(true);
	const [ errorMessage, setErrorMessage ] = useState("");
	const [ selectedBookID, setSelectedBookID ] = useState(null);
	const [ isSearchVisible, setIsSearchVisible ] = useState(false);
	const [ searchText, setSearchText ] = useState("");
	const requestVersion = useRef(0);
	const { author_id, author } = route.params;
	const backgroundColor = is_dark ? "#212936" : "#FFFFFF";
	const normalizedSearchText = searchText.trim().toLowerCase();
	const filteredBooks = normalizedSearchText.length == 0 ? books : books.filter(book => {
		return String(book.title || "").toLowerCase().includes(normalizedSearchText);
	});

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<Pressable onPress={toggleSearch} hitSlop={10} accessibilityRole="button" accessibilityLabel="search books">
					<Icon name="discover" color={is_dark ? "#FFFFFF" : "#000000"} size={18} />
				</Pressable>
			)
		});
	}, [navigation, is_dark, isSearchVisible]);

	React.useEffect(() => {
		loadBooks();

		return () => {
			requestVersion.current += 1;
		};
	}, [author_id]);

	async function loadBooks() {
		const current_request = ++requestVersion.current;
		setIsLoading(true);
		setErrorMessage("");

		try {
			const auth_token = await epilogueStorage.get(keys.authToken);
			const options = {};
			if ((auth_token != null) && (auth_token.length > 0)) {
				options.headers = {
					"Authorization": "Bearer " + auth_token
				};
			}

			const url = "https://micro.blog/books/authors/" + encodeURIComponent(author_id) + "?format=jsonfeed";
			const response = await fetch(url, options);
			if (!response.ok) {
				throw new Error("Could not load books");
			}

			const data = await response.json();
			if (requestVersion.current == current_request) {
				setBooks(booksFromJSONFeed(data));
			}
		}
		catch (error) {
			if (requestVersion.current == current_request) {
				setBooks([]);
				setErrorMessage("Could not load books by " + author + ".");
			}
		}
		finally {
			if (requestVersion.current == current_request) {
				setIsLoading(false);
			}
		}
	}

	async function onSelectBook(item) {
		if (selectedBookID != null) {
			return;
		}

		setSelectedBookID(item.id);
		const bookshelf_ids_with_book = await readBookshelfIDsContainingBook(item.isbn, item.id);
		const is_search = bookshelf_ids_with_book.length == 0;

		navigation.popTo("Details", {
			id: item.id,
			isbn: item.isbn,
			title: item.title,
			image: item.image,
			author: item.author || author,
			author_id: item.author_id || author_id,
			description: item.description || "",
			date: item.date,
			background_color: item.background_color,
			background_url: item.background_url,
			is_search: is_search,
			bookshelf_ids_with_book: bookshelf_ids_with_book
		}, { merge: true });
	}

	function toggleSearch() {
		if (isSearchVisible) {
			setSearchText("");
		}
		setIsSearchVisible(!isSearchVisible);
	}

	function renderBook({ item }) {
		const image_url = String(item.image || "").replace("http://", "https://");
		const is_selecting = String(item.id) == String(selectedBookID);

		return (
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={item.title + " by " + item.author}
				disabled={selectedBookID != null}
				onPress={() => onSelectBook(item)}
				style={({ pressed }) => [
					sheetStyles.bookRow,
					{ borderBottomColor: is_dark ? "#3B4351" : "#E5E5E5" },
					pressed ? sheetStyles.bookRowPressed : null
				]}
			>
				{image_url.length > 0 ? (
					<Image style={sheetStyles.bookCover} source={{ uri: image_url }} />
				) : (
					<View style={[ sheetStyles.bookCover, sheetStyles.bookCoverPlaceholder ]} />
				)}
				<View style={sheetStyles.bookText}>
					<Text style={[ sheetStyles.bookTitle, { color: is_dark ? "#FFFFFF" : "#111111" } ]} numberOfLines={2}>{item.title}</Text>
					<Text style={sheetStyles.bookAuthor} numberOfLines={1}>{item.author}</Text>
				</View>
				{is_selecting ? (
					<ActivityIndicator size="small" />
				) : null}
			</Pressable>
		);
	}

	if (isLoading) {
		return (
			<View style={[ sheetStyles.statusContainer, { backgroundColor: backgroundColor } ]}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (errorMessage.length > 0) {
		return (
			<View style={[ sheetStyles.statusContainer, { backgroundColor: backgroundColor } ]}>
				<Text style={[ sheetStyles.statusText, { color: is_dark ? "#E5E7EB" : "#333333" } ]}>{errorMessage}</Text>
				<Pressable onPress={loadBooks} style={sheetStyles.retryButton} accessibilityRole="button">
					<Text style={sheetStyles.retryButtonTitle}>Retry</Text>
				</Pressable>
			</View>
		);
	}

	if (books.length == 0) {
		return (
			<View style={[ sheetStyles.statusContainer, { backgroundColor: backgroundColor } ]}>
				<Text style={[ sheetStyles.statusText, { color: is_dark ? "#E5E7EB" : "#333333" } ]}>No books found.</Text>
			</View>
		);
	}

	return (
		<View style={[ sheetStyles.container, { backgroundColor: backgroundColor } ]}>
			{isSearchVisible ? (
				<View style={[ sheetStyles.searchContainer, { borderBottomColor: is_dark ? "#3B4351" : "#E5E5E5" } ]}>
					<TextInput
						autoFocus={true}
						clearButtonMode="while-editing"
						onChangeText={setSearchText}
						placeholder="Search books"
						placeholderTextColor="#777777"
						returnKeyType="done"
						style={[
							sheetStyles.searchField,
							{
								backgroundColor: is_dark ? "#111827" : "#F1F2F4",
								color: is_dark ? "#FFFFFF" : "#111111"
							}
						]}
						value={searchText}
					/>
				</View>
			) : null}
			<FlatList
				data={filteredBooks}
				keyboardShouldPersistTaps="handled"
				keyExtractor={item => String(item.id || item.isbn)}
				ListEmptyComponent={(
					<View style={sheetStyles.filteredEmptyContainer}>
						<Text style={[ sheetStyles.statusText, { color: is_dark ? "#E5E7EB" : "#333333" } ]}>No matching books.</Text>
					</View>
				)}
				renderItem={renderBook}
				style={sheetStyles.container}
			/>
		</View>
	);
}

const sheetStyles = StyleSheet.create({
	container: {
		flex: 1
	},
	bookRow: {
		alignItems: "center",
		borderBottomWidth: StyleSheet.hairlineWidth,
		flexDirection: "row",
		minHeight: 72,
		paddingHorizontal: 16,
		paddingVertical: 6
	},
	bookRowPressed: {
		opacity: 0.55
	},
	bookCover: {
		borderRadius: 3,
		height: 60,
		width: 40
	},
	bookCoverPlaceholder: {
		backgroundColor: "#D1D5DB"
	},
	bookText: {
		flex: 1,
		justifyContent: "center",
		marginLeft: 12,
		marginRight: 10
	},
	bookTitle: {
		fontSize: 15,
		fontWeight: "500"
	},
	bookAuthor: {
		color: "#777777",
		fontSize: 13,
		marginTop: 3
	},
	searchContainer: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		paddingHorizontal: 12,
		paddingVertical: 8
	},
	searchField: {
		borderRadius: 8,
		fontSize: 15,
		height: 36,
		paddingHorizontal: 10,
		paddingVertical: 6
	},
	filteredEmptyContainer: {
		alignItems: "center",
		padding: 24
	},
	statusContainer: {
		alignItems: "center",
		flex: 1,
		justifyContent: "center",
		padding: 24
	},
	statusText: {
		fontSize: 15,
		marginBottom: 14,
		textAlign: "center"
	},
	retryButton: {
		backgroundColor: "#337AB7",
		borderRadius: 6,
		paddingHorizontal: 18,
		paddingVertical: 9
	},
	retryButtonTitle: {
		color: "#FFFFFF",
		fontWeight: "600"
	}
});
