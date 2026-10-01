import React from "react";
import renderer from "react-test-renderer";
import { ActivityIndicator, FlatList, ImageBackground, StyleSheet, Text } from "react-native";
import { CalendarScreen } from "../src/screens/CalendarScreen";
import { readBookshelfIDsContainingBook } from "../src/BookshelfCache";
import epilogueStorage from "../src/Storage";
import { keys } from "../src/Constants";

jest.mock("../src/Storage", () => ({ get: jest.fn(async key => key === "auth_token" ? "test-token" : [
	{ id: "7", title: "Finished reading", type: "finished" }
]) }));
jest.mock("../src/BookshelfCache", () => ({ readBookshelfIDsContainingBook: jest.fn(async () => ["7"]) }));

const originalFetch = global.fetch;
afterEach(() => {
	global.fetch = originalFetch;
	jest.clearAllMocks();
});

it("loads the authenticated calendar and opens a book in details", async () => {
	global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ months: [
		{ month_key: "2026-09", year: 2026, month: 9, book_count: 1, page_count: 640,
			background_url: "https://example.com/background.jpg", books: [
				{ id: 42, title: "A Book", author: "An Author", isbn: "1234567890123", cover_url: "https://example.com/cover.jpg", finished_date: "2026-09-13", day: 13, page_count: 640 }
			] }
	] }) });
	const navigation = { navigate: jest.fn() };
	let screen;
	await renderer.act(async () => { screen = renderer.create(<CalendarScreen navigation={navigation} />); });
	expect(epilogueStorage.get).toHaveBeenCalledWith(keys.authToken);
	expect(epilogueStorage.get).toHaveBeenCalledWith(keys.allBookshelves);
	expect(global.fetch).toHaveBeenCalledTimes(1);
	expect(global.fetch).toHaveBeenCalledWith("https://micro.blog/books/calendar", { headers: { Authorization: "Bearer test-token" } });
	const list = screen.root.findByType(FlatList);
	expect(list.props.data).toHaveLength(1);
	const month = list.props.renderItem({ item: list.props.data[0] });
	const header = month.props.children[0];
	expect(header.type).toBe(ImageBackground);
	expect(header.props.imageStyle.opacity).toBe(0.45);
	expect(StyleSheet.flatten(header.props.style).backgroundColor).toBe("#10191C");
	expect(header.props.children[1].props.children.join("")).toBe("1 book · 640 pages");
	const bookButton = month.props.children[1][0];
	expect(bookButton.props.children[2].props.children[2].props.children.join("")).toBe("Finished September 13 · 640 pages");
	await renderer.act(async () => bookButton.props.onPress());
	expect(readBookshelfIDsContainingBook).toHaveBeenCalledWith("1234567890123", 42);
	expect(navigation.navigate).toHaveBeenCalledWith("Details", expect.objectContaining({ id: 42, title: "A Book", date: "2026-09-13T00:00:00", current_bookshelf: { id: "7", title: "Finished reading", type: "finished" } }));
	await renderer.act(async () => screen.unmount());
});

it("shows a retry message when loading fails", async () => {
	global.fetch = jest.fn(async () => ({ ok: false }));
	let screen;
	await renderer.act(async () => { screen = renderer.create(<CalendarScreen navigation={{ navigate: jest.fn() }} />); });
	expect(screen.root.findAllByType(Text).some(item => String(item.props.children).includes("Couldn’t load"))).toBe(true);
	await renderer.act(async () => screen.unmount());
});

it("keeps the center spinner until the page lookup finishes after calendar JSON", async () => {
	global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ months: [] }) }));
	const navigation = { navigate: jest.fn() };
	let screen;
	await renderer.act(async () => { screen = renderer.create(<CalendarScreen navigation={navigation} pageLoading={true} />); });
	expect(screen.root.findAllByType(ActivityIndicator)).toHaveLength(1);
	expect(screen.root.findAllByType(FlatList)).toHaveLength(0);
	await renderer.act(async () => { screen.update(<CalendarScreen navigation={navigation} pageLoading={false} />); });
	expect(screen.root.findAllByType(ActivityIndicator)).toHaveLength(0);
	expect(screen.root.findAllByType(FlatList)).toHaveLength(1);
	await renderer.act(async () => screen.unmount());
});
