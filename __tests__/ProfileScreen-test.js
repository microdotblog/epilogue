import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { FlatList, TextInput } from "react-native";
import renderer from "react-test-renderer";

import { ProfileScreen } from "../src/screens/ProfileScreen";

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
		expect(searchButton().props.disabled).toBe(true);
	}
	finally {
		await renderer.act(async () => { screen?.unmount(); });
		global.fetch = previousFetch;
		jest.useRealTimers();
	}
});
