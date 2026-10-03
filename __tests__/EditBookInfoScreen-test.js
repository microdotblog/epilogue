import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { TextInput } from "react-native";
import renderer from "react-test-renderer";

import { deleteLatestBooksCache, refreshAllBookshelfCachesInBackground } from "../src/BookshelfCache";
import { keys } from "../src/Constants";
import { EditBookInfoScreen } from "../src/screens/EditBookInfoScreen";

jest.mock("../src/BookshelfCache", () => ({
	deleteLatestBooksCache: jest.fn(() => Promise.resolve()),
	refreshAllBookshelfCachesInBackground: jest.fn()
}));

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

async function flushAsyncWork(count = 4) {
	for (let index = 0; index < count; index++) {
		await flushPromises();
	}
}

beforeEach(async () => {
	jest.clearAllMocks();
	await AsyncStorage.clear();
});

it("returns to the existing details screen after updating a book", async () => {
	await AsyncStorage.setItem(keys.authToken, "token");
	const previous_fetch = global.fetch;
	global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
	const navigation = {
		navigate: jest.fn(),
		popTo: jest.fn(),
		setOptions: jest.fn()
	};
	const route = {
		params: {
			id: "book-1",
			title: "Old Title",
			author: "Author",
			isbn: "123"
		}
	};
	let screen;

	try {
		await renderer.act(async () => {
			screen = renderer.create(<EditBookInfoScreen route={route} navigation={navigation} />);
		});
		await renderer.act(async () => {
			screen.root.findAllByType(TextInput)[0].props.onChangeText("  New Title  ");
		});

		const header_right = navigation.setOptions.mock.calls.at(-1)[0].headerRight();
		await renderer.act(async () => {
			header_right.props.onPress();
			await flushAsyncWork();
		});

		expect(deleteLatestBooksCache).toHaveBeenCalledTimes(1);
		expect(refreshAllBookshelfCachesInBackground).toHaveBeenCalledTimes(1);
		expect(navigation.popTo).toHaveBeenCalledWith("Details", {
			title: "New Title",
			author: "Author",
			isbn: "123"
		}, { merge: true });
		expect(navigation.navigate).not.toHaveBeenCalled();
	}
	finally {
		global.fetch = previous_fetch;
		await renderer.act(async () => {
			screen?.unmount();
		});
	}
});
