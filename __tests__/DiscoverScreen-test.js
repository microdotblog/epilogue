import React from "react";
import { FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import renderer from "react-test-renderer";
import { DiscoverScreen } from "../src/screens/DiscoverScreen";
import { readBookshelfIDsContainingBook } from "../src/BookshelfCache";
import epilogueStorage from "../src/Storage";
import { keys } from "../src/Constants";

jest.mock("@react-navigation/native", () => ({ useScrollToTop: jest.fn() }));
jest.mock("../src/ProfileHeaderButton", () => ({ useProfileHeader: jest.fn() }));
jest.mock("../src/Storage", () => ({ get: jest.fn(() => Promise.resolve([])) }));
jest.mock("../src/BookshelfCache", () => ({
	...jest.requireActual("../src/BookshelfCache"),
	readBookshelfIDsContainingBook: jest.fn(async () => [])
}));

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
	jest.clearAllMocks();
	epilogueStorage.get.mockImplementation(() => Promise.resolve([]));
	readBookshelfIDsContainingBook.mockImplementation(async () => []);
});

async function openDiscover(isPad) {
	Object.defineProperty(Platform, "isPad", { configurable: true, value: isPad });
	global.fetch = jest.fn(async () => ({ json: async () => ({ items: [book] }) }));
	let focus;
	const navigation = { navigate: jest.fn(), setOptions: jest.fn(), addListener: (event, handler) => { focus = handler; return () => {}; } };
	await renderer.act(async () => { screen = renderer.create(<DiscoverScreen navigation={navigation} />); });
	await renderer.act(async () => focus());
	return { navigation, focus };
}

function sourceButton(navigation, source) {
	const options = navigation.setOptions.mock.calls.at(-1)[0];
	const selector = options.unstable_headerRightItems ? options.unstable_headerRightItems()[0].element : options.headerRight();
	return selector.props.children.find(child => child.props.testID === `discover-source-${source}`);
}

async function layout(width) {
	await renderer.act(async () => screen.root.findAllByType(View).find(view => view.props.onLayout)
		.props.onLayout({ nativeEvent: { layout: { width } } }));
}

it("adapts iPad columns to the pane and crops covers to a proportional 2:3 frame", async () => {
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
	expect(screen.root.findByType(FastImage).props.resizeMode).toBe("cover");
});

it("preserves the phone grid sizing", async () => {
	await openDiscover(false);
	await layout(393);
	expect(screen.root.findByType(FlatList).props.numColumns).toBe(3);
	expect(StyleSheet.flatten(screen.root.findByType(TouchableOpacity).props.style).height).toBe(176);
	expect(screen.root.findByType(FastImage).props.resizeMode).toBe("cover");
});

it("switches feeds and uses the selected source for refresh and focus", async () => {
	const { navigation, focus } = await openDiscover(true);
	expect(navigation.setOptions.mock.calls.at(-1)[0].headerTitle).toBe("Recently Blogged");
	expect(global.fetch).toHaveBeenLastCalledWith("https://micro.blog/posts/discover/books");
	expect(sourceButton(navigation, "microblog").props.accessibilityState.selected).toBe(true);
	const bestseller = { ...book, id: "nyt-book" };
	global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ items: [bestseller] }) }));
	await renderer.act(async () => sourceButton(navigation, "nyt").props.onPress());
	expect(global.fetch).toHaveBeenLastCalledWith("https://micro.blog/posts/discover/books/bestsellers");
	expect(sourceButton(navigation, "nyt").props.accessibilityState.selected).toBe(true);
	expect(navigation.setOptions.mock.calls.at(-1)[0].headerTitle).toBe("NYT Best Sellers");
	expect(screen.root.findByType(FlatList).props.data).toEqual([bestseller]);
	await renderer.act(async () => screen.root.findByType(FlatList).props.refreshControl.props.onRefresh());
	await renderer.act(async () => focus());
	expect(global.fetch.mock.calls.map(([url]) => url)).toEqual(Array(3).fill("https://micro.blog/posts/discover/books/bestsellers"));
	await renderer.act(async () => sourceButton(navigation, "microblog").props.onPress());
	expect(global.fetch).toHaveBeenLastCalledWith("https://micro.blog/posts/discover/books");
	expect(navigation.setOptions.mock.calls.at(-1)[0].headerTitle).toBe("Recently Blogged");
});

it("ignores a stale feed response after switching sources", async () => {
	const { navigation } = await openDiscover(true);
	let resolveNYT;
	global.fetch = jest.fn(() => new Promise(resolve => { resolveNYT = resolve; }));
	await renderer.act(async () => sourceButton(navigation, "nyt").props.onPress());
	expect(sourceButton(navigation, "nyt").props.accessibilityState.selected).toBe(true);
	expect(screen.root.findAllByType(FlatList)).toHaveLength(0);
	global.fetch = jest.fn(async () => ({ json: async () => ({ items: [book] }) }));
	await renderer.act(async () => sourceButton(navigation, "microblog").props.onPress());
	await renderer.act(async () => resolveNYT({ json: async () => ({ items: [{ ...book, id: "stale" }] }) }));
	expect(screen.root.findByType(FlatList).props.data).toEqual([book]);
});

it("handles an unavailable feed and allows retrying it", async () => {
	const { navigation } = await openDiscover(false);
	global.fetch = jest.fn(async () => ({ ok: false, status: 404 }));
	await renderer.act(async () => sourceButton(navigation, "nyt").props.onPress());
	expect(screen.root.findAllByType(FlatList)).toHaveLength(0);
	global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ items: [book] }) }));
	const retry = screen.root.findByProps({ testID: "discover-retry" });
	await renderer.act(async () => retry.props.onPress());
	expect(global.fetch).toHaveBeenLastCalledWith("https://micro.blog/posts/discover/books/bestsellers");
	expect(screen.root.findByType(FlatList).props.data).toEqual([book]);
});

it("opens recently blogged books in the browser but NYT books in native details", async () => {
	const { navigation } = await openDiscover(true);
	await renderer.act(async () => screen.root.findByType(TouchableOpacity).props.onPress());
	expect(InAppBrowser.open).toHaveBeenCalledWith(book.url, { animated: true });
	expect(navigation.navigate).not.toHaveBeenCalled();
	InAppBrowser.open.mockClear();
	const bestseller = {
		id: "9780593726259", title: "Hollow Bones", content_text: "A book description from the NYT feed.",
		image: "https://example.com/nyt.jpg", authors: [{ name: "Jodi Picoult" }],
		_microblog: { isbn: "9780593726259", book_title: "Hollow Bones", book_author: "Jodi Picoult", cover_url: "https://example.com/nyt.jpg" }
	};
	const currentShelf = { id: "A", title: "Currently reading" };
	const otherShelf = { id: "B", title: "Want to read" };
	epilogueStorage.get.mockImplementation(async key => key === keys.currentBookshelf ? currentShelf : [currentShelf, otherShelf]);
	readBookshelfIDsContainingBook.mockResolvedValue(["B"]);
	global.fetch = jest.fn(async () => ({ json: async () => ({ items: [bestseller] }) }));
	await renderer.act(async () => sourceButton(navigation, "nyt").props.onPress());
	await renderer.act(async () => screen.root.findByType(TouchableOpacity).props.onPress());
	expect(InAppBrowser.open).not.toHaveBeenCalled();
	expect(readBookshelfIDsContainingBook).toHaveBeenCalledWith(bestseller._microblog.isbn, bestseller.id);
	expect(navigation.navigate).toHaveBeenCalledWith("Details", expect.objectContaining({
		id: bestseller.id, isbn: bestseller._microblog.isbn, title: "Hollow Bones", author: "Jodi Picoult",
		image: bestseller.image, description: bestseller.content_text, is_search: true,
		bookshelves: [currentShelf, otherShelf], current_bookshelf: currentShelf, bookshelf_ids_with_book: ["B"]
	}));
	global.fetch = jest.fn(async () => ({ json: async () => ({ items: [book] }) }));
	await renderer.act(async () => sourceButton(navigation, "microblog").props.onPress());
	navigation.navigate.mockClear();
	await renderer.act(async () => screen.root.findByType(TouchableOpacity).props.onPress());
	expect(InAppBrowser.open).toHaveBeenCalledWith(book.url, { animated: true });
	expect(navigation.navigate).not.toHaveBeenCalled();
});
