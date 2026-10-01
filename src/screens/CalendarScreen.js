import React from "react";
import { ActivityIndicator, FlatList, ImageBackground, Pressable, RefreshControl, StyleSheet, Text, View, useColorScheme } from "react-native";
import FastImage from "react-native-fast-image";

import { calendarMonthsFromFinishedFeed } from "../CalendarData";
import { keys } from "../Constants";
import epilogueStorage from "../Storage";

export function CalendarScreen({ navigation }) {
	const dark = useColorScheme() === "dark";
	const [months, setMonths] = React.useState([]);
	const [bookshelf, setBookshelf] = React.useState(null);
	const [bookshelves, setBookshelves] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [refreshing, setRefreshing] = React.useState(false);
	const [error, setError] = React.useState(null);
	const mounted = React.useRef(true);

	React.useEffect(() => {
		mounted.current = true;
		loadCalendar();
		return () => { mounted.current = false; };
	}, []);

	async function loadCalendar(isRefresh = false) {
		if (isRefresh) setRefreshing(true);
		setError(null);
		try {
			const token = await epilogueStorage.get(keys.authToken);
			if (!token) throw new Error("Missing sign-in token");
			const options = { headers: { Authorization: `Bearer ${token}` } };
			const shelfResponse = await fetch("https://micro.blog/books/bookshelves", options);
			if (!shelfResponse.ok) throw new Error("Could not load bookshelves");
			const shelfFeed = await shelfResponse.json();
			const shelves = (shelfFeed.items || []).map(item => ({
				id: String(item.id), title: item.title, type: item._microblog?.type
			}));
			const finishedShelf = shelves.find(item => item.type === "finished");
			if (!finishedShelf) throw new Error("No finished bookshelf");
			const response = await fetch(`https://micro.blog/books/bookshelves/${finishedShelf.id}`, options);
			if (!response.ok) throw new Error("Could not load finished books");
			const feed = await response.json();
			if (!Array.isArray(feed.items)) throw new Error("Invalid finished books feed");
			if (!mounted.current) return;
			setBookshelves(shelves);
			setBookshelf(finishedShelf);
			setMonths(calendarMonthsFromFinishedFeed(feed));
		} catch (loadError) {
			if (mounted.current) setError("Couldn’t load your book calendar. Pull down to try again.");
		} finally {
			if (mounted.current) {
				setLoading(false);
				setRefreshing(false);
			}
		}
	}

	function openBook(book) {
		navigation.navigate("Details", {
			id: book.id,
			isbn: book.isbn,
			title: book.title,
			image: book.coverURL,
			author: book.author,
			author_id: book.authorID,
			description: book.description,
			date: book.date,
			background_color: book.backgroundColor,
			background_url: book.backgroundURL,
			bookshelves,
			current_bookshelf: bookshelf,
			is_search: false
		});
	}

	function renderBook(book, month, index) {
		return (
			<Pressable key={`${book.id}-${index}`} onPress={() => openBook(book)} accessibilityRole="button"
				style={[calendarStyles.bookRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth }, { borderColor: dark ? "#414653" : "#DDE1E0" }]}>
				<View style={[calendarStyles.dayColumn, { borderColor: dark ? "#414653" : "#DDE1E0" }]}>
					<Text style={[calendarStyles.dayMonth, { color: dark ? "#BBC1C7" : "#43504F" }]}>{month.name.slice(0, 3).toUpperCase()}</Text>
					<Text style={[calendarStyles.dayNumber, { color: dark ? "#FFFFFF" : "#26302F" }]}>{book.day}</Text>
				</View>
				{book.coverURL ? <FastImage source={{ uri: book.coverURL }} style={calendarStyles.cover} resizeMode="cover" /> : <View style={[calendarStyles.cover, calendarStyles.coverPlaceholder]} />}
				<View style={calendarStyles.details}>
					<Text style={[calendarStyles.bookTitle, { color: dark ? "#FFFFFF" : "#26302F" }]}>{book.title}</Text>
					{book.author ? <Text style={[calendarStyles.secondary, { color: dark ? "#BBC1C7" : "#647371" }]}>{book.author}</Text> : null}
					<Text style={[calendarStyles.finished, { color: dark ? "#BBC1C7" : "#647371" }]}>Finished {month.name} {book.day}</Text>
				</View>
			</Pressable>
		);
	}

	function renderMonth({ item: month }) {
		return (
			<View style={[calendarStyles.card, { backgroundColor: dark ? "#252B38" : "#FFFFFF", borderColor: dark ? "#414653" : "#DDE1E0" }]}>
				<ImageBackground source={month.backgroundURL ? { uri: month.backgroundURL } : undefined}
					style={calendarStyles.monthHeader} imageStyle={{ opacity: 0.45 }}>
					<Text style={calendarStyles.monthTitle}>{month.name.toUpperCase()} <Text style={calendarStyles.year}>{month.year}</Text></Text>
					<Text style={calendarStyles.monthSummary}>{month.books.length} {month.books.length === 1 ? "book" : "books"}</Text>
				</ImageBackground>
				{month.books.map((book, index) => renderBook(book, month, index))}
			</View>
		);
	}

	return (
		<View style={[calendarStyles.screen, { backgroundColor: dark ? "#212936" : "#F4F6F7" }]}>
			{loading ? <ActivityIndicator style={calendarStyles.spinner} /> :
				<FlatList contentInsetAdjustmentBehavior="automatic" data={months} renderItem={renderMonth}
					keyExtractor={item => item.key} contentContainerStyle={calendarStyles.list}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCalendar(true)} />}
					ListEmptyComponent={<Text style={[calendarStyles.empty, { color: dark ? "#BBC1C7" : "#647371" }]}>{error || "No finished books in the last 2 years."}</Text>} />}
		</View>
	);
}

const calendarStyles = StyleSheet.create({
	screen: { flex: 1 },
	spinner: { flex: 1 },
	list: { width: "100%", maxWidth: 1000, alignSelf: "center", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
	card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: "hidden", marginBottom: 18 },
	monthHeader: { minHeight: 116, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 22, backgroundColor: "#10191C" },
	monthTitle: { color: "#FFFAF2", fontSize: 23, fontWeight: "700" },
	year: { color: "rgba(255,250,242,0.75)", fontWeight: "600" },
	monthSummary: { color: "#FFFAF2", fontSize: 15, marginTop: 8 },
	bookRow: { flexDirection: "row", alignItems: "center", minHeight: 130, paddingRight: 16 },
	dayColumn: { width: 68, alignSelf: "stretch", alignItems: "center", justifyContent: "center", borderRightWidth: StyleSheet.hairlineWidth },
	dayMonth: { fontSize: 12, letterSpacing: 0.5 },
	dayNumber: { fontSize: 25, marginTop: 4 },
	cover: { width: 52, height: 78, borderRadius: 5, marginHorizontal: 14, backgroundColor: "#E3E8E5" },
	coverPlaceholder: { backgroundColor: "#E3E8E5" },
	details: { flex: 1, paddingVertical: 15 },
	bookTitle: { fontSize: 17, fontWeight: "700" },
	secondary: { fontSize: 14, marginTop: 4 },
	finished: { fontSize: 13, marginTop: 11 },
	empty: { paddingTop: 60, textAlign: "center", fontSize: 16 }
});
