import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Text } from "react-native";
import renderer from "react-test-renderer";

import { keys } from "../src/Constants";
import { BlogsScreen } from "../src/screens/BlogsScreen";

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

it("marks the current blog and persists a new selection", async () => {
	await AsyncStorage.clear();
	await AsyncStorage.setItem(keys.authToken, "token");
	await AsyncStorage.setItem(keys.currentBlogID, "blog-2");

	const previous_fetch = global.fetch;
	global.fetch = jest.fn(() => Promise.resolve({
		json: () => Promise.resolve({
			destination: [
				{ uid: "blog-1", name: "First Blog" },
				{ uid: "blog-2", name: "Second Blog" }
			]
		})
	}));

	let focus_handler;
	const navigation = {
		addListener: jest.fn((event, handler) => {
			if (event == "focus") {
				focus_handler = handler;
			}
			return jest.fn();
		}),
		goBack: jest.fn()
	};

	let screen;
	try {
		await renderer.act(async () => {
			screen = renderer.create(<BlogsScreen navigation={navigation} />);
			await flushPromises();
		});
		await renderer.act(async () => {
			focus_handler();
			await flushPromises();
		});

		const first_row = screen.root.findByProps({ testID: "blog-list-row-blog-1" });
		const second_row = screen.root.findByProps({ testID: "blog-list-row-blog-2" });
		expect(first_row.props.accessibilityState).toEqual({ selected: false });
		expect(second_row.props.accessibilityState).toEqual({ selected: true });
		expect(first_row.findAllByType(Text).some(node => node.props.children == "✓")).toBe(false);
		expect(second_row.findAllByType(Text).some(node => node.props.children == "✓")).toBe(true);

		await renderer.act(async () => {
			first_row.props.onPress();
			await flushPromises();
		});
		expect(await AsyncStorage.getItem(keys.currentBlogID)).toBe("blog-1");
		expect(await AsyncStorage.getItem(keys.currentBlogName)).toBe("First Blog");
		expect(navigation.goBack).toHaveBeenCalledTimes(1);
	}
	finally {
		global.fetch = previous_fetch;
		await renderer.act(async () => {
			screen?.unmount();
		});
	}
});
