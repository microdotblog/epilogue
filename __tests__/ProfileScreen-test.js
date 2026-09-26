import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { FlatList, TextInput } from "react-native";
import renderer from "react-test-renderer";
import RNFS from "react-native-fs";

import { ProfileScreen } from "../src/screens/ProfileScreen";
import { writeProfilePostsCache } from "../src/ProfilePostsCache";

let cacheFiles;
beforeEach(() => {
	cacheFiles = new Map();
	RNFS.readFile.mockImplementation(async path => {
		if (!cacheFiles.has(path)) throw new Error("Not found");
		return cacheFiles.get(path);
	});
	RNFS.writeFile.mockImplementation(async (path, contents) => { cacheFiles.set(path, contents); });
	jest.clearAllMocks();
});

let mockFocus;
let mockBlur;
jest.mock("@react-navigation/native", () => ({
	useFocusEffect: callback => {
		const React = require("react");
		React.useEffect(() => {
			mockFocus = () => { mockBlur = callback(); };
			mockFocus();
			return () => mockBlur?.();
		}, [callback]);
	}
}));

const flushPromises = () => new Promise(resolve => setImmediate(resolve));
const post = (id, content) => ({
	properties: {
		uid: [id], url: [`https://example.com/${id}`], content: [content],
		published: [`2026-09-${id.padStart(2, "0")}T12:00:00Z`]
	}
});

it("waits for every page, searches cached posts live, and restores the list on cancel", async () => {
	jest.useFakeTimers({ doNotFake: ["setImmediate"] });
	await AsyncStorage.clear();
	const previousFetch = global.fetch;
	let finishLastPage;
	const pages = [
		[post("1", "Reading [Dune](https://micro.blog/books/1).")],
		[post("2", "Watching [Arrival](https://themoviedb.org/movie/2).")],
		[],
		[post("3", "Finished [DUNE Messiah](https://micro.blog/books/3).")],
		[]
	];
	global.fetch = jest.fn()
		.mockImplementation(() => {
			if (pages.length > 0) {
				const items = pages.shift();
				return Promise.resolve({ json: async () => ({ items }) });
			}
			return new Promise(resolve => {
				finishLastPage = () => resolve({ json: async () => ({ items: [] }) });
			});
		});
	let screen;
	const searchButton = () => screen.root.findAllByProps({ accessibilityLabel: "Search posts", accessibilityRole: "button" })[0];
	const listIDs = () => screen.root.findByType(FlatList).props.data.map(item => item.id);
	try {
		await renderer.act(async () => {
			screen = renderer.create(<ProfileScreen navigation={{ setOptions: jest.fn() }} />);
			await flushPromises();
		});
		expect(searchButton().props.disabled).toBe(true);
		for (let page = 0; page < 5; page++) {
			await renderer.act(async () => {
				jest.advanceTimersByTime(500);
				await flushPromises();
			});
		}
		expect(global.fetch).toHaveBeenCalledTimes(6);
		expect(listIDs()).toEqual(["2", "1"]);
		expect(searchButton().props.disabled).toBe(true);
		expect(RNFS.writeFile).not.toHaveBeenCalled();
		await renderer.act(async () => {
			finishLastPage();
			await flushPromises();
		});
		await renderer.act(async () => {
			jest.advanceTimersByTime(500);
			await flushPromises();
		});
		expect(searchButton().props.disabled).toBe(false);
		expect(listIDs()).toEqual(["3", "2", "1"]);
		expect(JSON.parse([...cacheFiles.values()][0]).posts.map(item => item.id)).toEqual(["3", "2", "1"]);
		await renderer.act(async () => { searchButton().props.onPress(); });
		expect(searchButton()).toBeUndefined();
		const input = () => screen.root.findByType(TextInput);
		await renderer.act(async () => { input().props.onChangeText("  dune  "); });
		expect(listIDs()).toEqual(["3", "1"]);
		await renderer.act(async () => { input().props.onChangeText("arrival"); });
		expect(listIDs()).toEqual(["2"]);
		await renderer.act(async () => { input().props.onChangeText("no matches"); });
		expect(listIDs()).toEqual([]);
		await renderer.act(async () => { input().props.onChangeText(""); });
		expect(listIDs()).toEqual(["3", "2", "1"]);
		await renderer.act(async () => { input().props.onChangeText("dune"); });
		await renderer.act(async () => {
			screen.root.findByProps({ accessibilityLabel: "Cancel post search" }).props.onPress();
		});
		expect(listIDs()).toEqual(["3", "2", "1"]);
		expect(searchButton().props.disabled).toBe(false);
		expect(global.fetch).toHaveBeenCalledTimes(6);
		await renderer.act(async () => {
			mockBlur();
			mockFocus();
			await flushPromises();
		});
		// A complete cache is searchable while refreshing on re-entry.
		expect(searchButton().props.disabled).toBe(false);
	}
	finally {
		await renderer.act(async () => { screen?.unmount(); });
		global.fetch = previousFetch;
		jest.useRealTimers();
	}
});

const cacheIdentity = ["", "https://micro.blog/micropub", ""];
const cachedPost = (id, text) => ({
	id, text, display_text: text, url: `https://example.com/${id}`,
	posted_at: `2026-09-${id.padStart(2, "0")}`,
	published_at: `2026-09-${id.padStart(2, "0")}T12:00:00Z`, cover_url: ""
});

it("loads the file immediately and stops each source at its own cached newest post", async () => {
	jest.useFakeTimers({ doNotFake: ["setImmediate"] });
	await AsyncStorage.clear();
	await writeProfilePostsCache(cacheIdentity, [
		{ ...cachedPost("3", "Old [Dune Messiah](https://micro.blog/books/3)"), id: 3 },
		{ ...cachedPost("2", "Old [Arrival](https://themoviedb.org/movie/2)"), id: 2 },
		{ ...cachedPost("1", "Reading [Dune](https://micro.blog/books/1)"), id: 1 }
	]);
	RNFS.writeFile.mockClear();
	const previousFetch = global.fetch;
	const pages = [
		[post("4", "New [Book](https://micro.blog/books/4)")],
		[post("2", "Updated [Arrival](https://themoviedb.org/movie/2)")],
		[],
		[post("3", "Updated [Dune Messiah](https://micro.blog/books/3)")]
	];
	for (const page of pages) {
		for (const item of page) item.properties.uid[0] = Number(item.properties.uid[0]);
	}
	global.fetch = jest.fn(async () => ({ json: async () => ({ items: pages.shift() }) }));
	let screen;
	try {
		await renderer.act(async () => {
			screen = renderer.create(<ProfileScreen navigation={{ setOptions: jest.fn() }} />);
			await flushPromises();
		});
		expect(screen.root.findByType(FlatList).props.data.map(item => item.id)).toEqual(["3", "2", "1"]);
		for (let page = 0; page < 4; page++) {
			await renderer.act(async () => {
				jest.advanceTimersByTime(500);
				await flushPromises();
			});
		}
		expect(global.fetch).toHaveBeenCalledTimes(4);
		expect(global.fetch.mock.calls[3][0]).toContain("offset=1");
		const merged = screen.root.findByType(FlatList).props.data;
		expect(merged.map(item => item.id)).toEqual(["4", "3", "2", "1"]);
		expect(merged[1].display_text).toContain("Updated Dune Messiah");
		expect(merged[2].display_text).toContain("Updated Arrival");
		expect(RNFS.writeFile).toHaveBeenCalledTimes(1);
		expect(JSON.parse([...cacheFiles.values()][0]).posts).toEqual(merged);
	}
	finally {
		await renderer.act(async () => { screen?.unmount(); });
		global.fetch = previousFetch;
		jest.useRealTimers();
	}
});

it.each(["failure", "blur"])("preserves the complete file after a refresh %s", async mode => {
	await AsyncStorage.clear();
	const cached = [cachedPost("1", "Reading https://micro.blog/books/1")];
	await writeProfilePostsCache(cacheIdentity, cached);
	RNFS.writeFile.mockClear();
	const previousFetch = global.fetch;
	let finish;
	global.fetch = jest.fn(() => new Promise(resolve => { finish = resolve; }));
	let screen;
	try {
		await renderer.act(async () => {
			screen = renderer.create(<ProfileScreen navigation={{ setOptions: jest.fn() }} />);
			await flushPromises();
		});
		await renderer.act(async () => {
			if (mode === "blur") mockBlur();
			finish(mode === "failure" ? { ok: false } : { json: async () => ({ items: [] }) });
			await flushPromises();
		});
		expect(RNFS.writeFile).not.toHaveBeenCalled();
		expect(JSON.parse([...cacheFiles.values()][0]).posts).toEqual(cached);
		expect(screen.root.findByType(FlatList).props.data).toEqual(cached);
	}
	finally {
		await renderer.act(async () => { screen?.unmount(); });
		global.fetch = previousFetch;
	}
});
