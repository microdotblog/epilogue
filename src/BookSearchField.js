import React, { useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, useColorScheme, View } from "react-native";
import { BookScanner } from "./BookScanner";
import { Icon } from "./Icon";

export const BookSearchField = React.forwardRef(function BookSearchField({ styles, navigation, onBook, onManualEntry, ...inputProps }, ref) {
	const [scanning, setScanning] = useState(false);
	const dark = useColorScheme() === "dark";
	React.useEffect(() => navigation.addListener("blur", () => setScanning(false)), [navigation]);
	return (
		<View>
			<View style={layout.row}>
				<TextInput {...inputProps} ref={ref} style={[styles.searchField, layout.input]} returnKeyType="search"
					placeholder="Search for books to add" placeholderTextColor="#6d6d72" clearButtonMode="always" />
				<Pressable accessibilityRole="button" accessibilityLabel="Scan book barcode" testID="scan-book"
					hitSlop={{ top: 2, bottom: 2 }}
					onPress={() => { Keyboard.dismiss(); setScanning(true); }}
					style={({ pressed }) => [layout.scan, { backgroundColor: dark ? "#34343A" : "#E9E9EB", opacity: pressed ? 0.6 : 1 }]}>
					<Icon name="barcode" size={23} color={dark ? "white" : "black"} />
				</Pressable>
			</View>
			{scanning && <BookScanner onClose={() => setScanning(false)} onManualEntry={onManualEntry}
				onBook={book => onBook({ ...book, image: book.cover_url, is_search: true, date: "" })} />}
		</View>
	);
});

const layout = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "flex-start" },
	input: { flex: 1, minWidth: 0, marginRight: 8 },
	scan: { width: 44, height: 40, marginTop: 1, marginRight: 20, marginBottom: 5, borderRadius: 12, alignItems: "center", justifyContent: "center" }
});
