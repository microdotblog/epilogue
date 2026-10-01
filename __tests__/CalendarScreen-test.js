import React from "react";
import renderer from "react-test-renderer";
import { FlatList, ImageBackground, StyleSheet, Text } from "react-native";
import { CalendarScreen } from "../src/screens/CalendarScreen";
import epilogueStorage from "../src/Storage";
import { keys } from "../src/Constants";

jest.mock("../src/Storage", () => ({ get: jest.fn(async () => "test-token") }));

const originalFetch = global.fetch;
afterEach(() => {
	global.fetch = originalFetch;
	jest.clearAllMocks();
});

it("loads the finished shelf and opens a calendar book in details", async () => {
	global.fetch = jest.fn()
		.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [
			{ id: 7, title: "Finished reading", _microblog: { type: "finished" } }
		] }) })
		.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [
			{ id: 42, title: "A Book", image: "https://example.com/cover.jpg", date_published: new Date().toISOString(),
				authors: [{ name: "An Author" }], _microblog: { isbn: "1234567890123", background_url: "https://example.com/background.jpg" } }
		] }) });
	const navigation = { navigate: jest.fn() };
	let screen;
	await renderer.act(async () => { screen = renderer.create(<CalendarScreen navigation={navigation} />); });
	expect(epilogueStorage.get).toHaveBeenCalledWith(keys.authToken);
	expect(global.fetch).toHaveBeenNthCalledWith(1, "https://micro.blog/books/bookshelves", { headers: { Authorization: "Bearer test-token" } });
	expect(global.fetch).toHaveBeenNthCalledWith(2, "https://micro.blog/books/bookshelves/7", { headers: { Authorization: "Bearer test-token" } });
	const list = screen.root.findByType(FlatList);
	expect(list.props.data).toHaveLength(1);
	const month = list.props.renderItem({ item: list.props.data[0] });
	const header = month.props.children[0];
	expect(header.type).toBe(ImageBackground);
	expect(header.props.imageStyle.opacity).toBe(0.45);
	expect(StyleSheet.flatten(header.props.style).backgroundColor).toBe("#10191C");
	const bookButton = month.props.children[1][0];
	await renderer.act(async () => bookButton.props.onPress());
	expect(navigation.navigate).toHaveBeenCalledWith("Details", expect.objectContaining({ id: 42, title: "A Book", current_bookshelf: { id: "7", title: "Finished reading", type: "finished" } }));
	await renderer.act(async () => screen.unmount());
});

it("shows a retry message when loading fails", async () => {
	global.fetch = jest.fn(async () => ({ ok: false }));
	let screen;
	await renderer.act(async () => { screen = renderer.create(<CalendarScreen navigation={{ navigate: jest.fn() }} />); });
	expect(screen.root.findAllByType(Text).some(item => String(item.props.children).includes("Couldn’t load"))).toBe(true);
	await renderer.act(async () => screen.unmount());
});
