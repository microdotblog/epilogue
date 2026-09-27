import React from "react";
import { FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import renderer from "react-test-renderer";
import { DiscoverScreen } from "../src/screens/DiscoverScreen";

jest.mock("@react-navigation/native", () => ({ useScrollToTop: jest.fn() }));
jest.mock("../src/ProfileHeaderButton", () => ({ useProfileHeader: jest.fn() }));
jest.mock("../src/Storage", () => ({ get: jest.fn(() => Promise.resolve([])) }));

const originalIsPad = Object.getOwnPropertyDescriptor(Platform, "isPad");
const originalFetch = global.fetch;
const book = { id: "1", url: "https://example.com/post", _microblog: {
	book_title: "A book", book_author: "An author", cover_url: "https://example.com/cover.jpg"
} };
let screen;

afterEach(async () => {
	await renderer.act(async () => screen?.unmount());
	if (originalIsPad) Object.defineProperty(Platform, "isPad", originalIsPad);
	else delete Platform.isPad;
	global.fetch = originalFetch;
});

async function openDiscover(isPad) {
	Object.defineProperty(Platform, "isPad", { configurable: true, value: isPad });
	global.fetch = jest.fn(async () => ({ json: async () => ({ items: [book] }) }));
	let focus;
	const navigation = { addListener: (event, handler) => { focus = handler; return () => {}; } };
	await renderer.act(async () => { screen = renderer.create(<DiscoverScreen navigation={navigation} />); });
	await renderer.act(async () => focus());
}

async function layout(width) {
	await renderer.act(async () => screen.root.findAllByType(View).find(view => view.props.onLayout)
		.props.onLayout({ nativeEvent: { layout: { width } } }));
}

it("adapts iPad columns to the pane and gives covers a 2:3 frame without cropping", async () => {
	await openDiscover(true);
	for (const [width, columns] of [[976, 6], [816, 5], [656, 4], [336, 2]]) {
		await layout(width);
		const list = screen.root.findByType(FlatList);
		expect(list.props.numColumns).toBe(columns);
		const cell = list.props.renderItem({ item: book });
		expect(cell.props.style.flex).toBe(1 / columns);
		const coverButton = cell.props.children.props.children;
		const style = StyleSheet.flatten(coverButton.props.style);
		expect(style).toMatchObject({ aspectRatio: 2 / 3, flex: 0, backgroundColor: "transparent" });
		expect(style.height).toBeUndefined();
	}
	expect(screen.root.findByType(FastImage).props.resizeMode).toBe("contain");
});

it("preserves the phone grid sizing", async () => {
	await openDiscover(false);
	await layout(393);
	expect(screen.root.findByType(FlatList).props.numColumns).toBe(3);
	expect(StyleSheet.flatten(screen.root.findByType(TouchableOpacity).props.style).height).toBe(176);
	expect(screen.root.findByType(FastImage).props.resizeMode).toBe("cover");
});
