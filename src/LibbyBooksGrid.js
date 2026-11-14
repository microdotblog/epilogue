import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { booksFromJSONFeed } from "./BookshelfCache";
import { keys } from "./Constants";
import { useEpilogueStyle } from "./hooks/useEpilogueStyle";
import storage from "./Storage";

const bookshelvesURL = "https://micro.blog/books/bookshelves";

async function fetchFeed(url, options) {
	const response = await fetch(url, options);
	if (!response.ok) throw new Error("Could not load bookshelf");
	return response.json();
}

export function LibbyBooksGrid() {
	const theme = useEpilogueStyle();
	const [books, setBooks] = useState([]);
	const [loadFailed, setLoadFailed] = useState(false);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;

		async function loadBooks() {
			const token = await storage.get(keys.authToken);
			if (signal.aborted || !token) return;
			const options = { headers: { Authorization: `Bearer ${token}` }, signal };
			const shelves = await fetchFeed(bookshelvesURL, options);
			if (signal.aborted) return;
			const libraryShelves = shelves.items.filter(shelf => {
				const type = shelf._microblog?.type;
				return type === "loans" || type === "holds";
			});
			const results = await Promise.allSettled(libraryShelves.map(async shelf => {
				const feed = await fetchFeed(`${bookshelvesURL}/${shelf.id}`, options);
				return booksFromJSONFeed(feed);
			}));
			if (signal.aborted) return;

			const uniqueBooks = new Map();
			for (const result of results) {
				if (result.status !== "fulfilled") continue;
				for (const book of result.value) {
					const key = book.isbn || String(book.id);
					const existing = uniqueBooks.get(key);
					if (!existing || (!existing.image && book.image)) uniqueBooks.set(key, book);
				}
			}
			setBooks(Array.from(uniqueBooks));
			setLoadFailed(results.some(result => result.status === "rejected"));
		}

		loadBooks().catch(() => {
			if (!signal.aborted) setLoadFailed(true);
		});
		return () => controller.abort();
	}, []);

	return (
		<>
			{books.length > 0 && (
				<View style={styles.grid}>
					{books.map(([key, book]) => <BookCover key={key} book={book} theme={theme} />)}
				</View>
			)}
			{loadFailed && <Text style={[theme.signInText, styles.error]}>Could not load all library books.</Text>}
		</>
	);
}

function BookCover({ book, theme }) {
	const [failedImage, setFailedImage] = useState(false);
	const imageURL = book.image?.replace(/^http:/, "https:");

	return (
		<View style={styles.gridCell}>
			{imageURL && !failedImage ? (
				<Image
					style={styles.cover}
					source={{ uri: imageURL }}
					resizeMode="cover"
					accessible
					accessibilityLabel={book.title}
					onError={() => setFailedImage(true)}
				/>
			) : (
				<View style={[theme.plainButton, styles.cover, styles.placeholder]}>
					<Text style={[theme.plainButtonTitle, styles.placeholderTitle]} numberOfLines={4}>{book.title}</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 18, marginTop: 20 },
	gridCell: { width: "33.333%" },
	cover: { width: "83%", aspectRatio: 2 / 3, borderRadius: 4 },
	placeholder: { marginLeft: 0, alignItems: "center", justifyContent: "center" },
	placeholderTitle: { textAlign: "center" },
	error: { marginTop: 14, marginBottom: 0 }
});
