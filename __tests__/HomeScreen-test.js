import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { View } from "react-native";
import renderer from "react-test-renderer";

import { keys } from "../src/Constants";
import { HomeScreen } from "../src/screens/HomeScreen";

jest.mock("@react-navigation/native", () => ({
	useScrollToTop: jest.fn()
}));

jest.mock("../src/BookshelfPopupMenu", () => {
	const React = require("react");
	const { View } = require("react-native");

	return {
		BookshelfPopupMenu: React.forwardRef((props, ref) => {
			React.useImperativeHandle(ref, () => ({
				setEnabled: jest.fn()
			}), []);
			return React.createElement(View, { ...props, testID: "bookshelf-popup" });
		}),
		BookshelfPopupMenuTrigger: ({ children }) => React.createElement(React.Fragment, null, children)
	};
});

jest.mock("../src/BookshelfCache", () => {
	const actual = jest.requireActual("../src/BookshelfCache");
	return {
		...actual,
		cacheBookshelfDataForID: jest.fn(),
		refreshAllBookshelfCachesInBackground: jest.fn(),
		warmAllBookshelfCachesInBackground: jest.fn(),
		writeLatestBooksCache: jest.fn()
	};
});

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

async function flushAsyncWork(count = 4) {
	for (let index = 0; index < count; index++) {
		await flushPromises();
	}
}

function navigationHarness() {
	let focus_handler;
	const navigation = {
		addListener: jest.fn((event, handler) => {
			if (event == "focus") {
				focus_handler = handler;
			}
			return jest.fn();
		}),
		isFocused: jest.fn(() => true),
		navigate: jest.fn(),
		setOptions: jest.fn()
	};

	return {
		focus: () => focus_handler(),
		navigation
	};
}

async function seedHomeStorage(bookshelves, current_bookshelf, auth_token = "old-token") {
	await AsyncStorage.setItem(keys.allBookshelves, JSON.stringify(bookshelves));
	await AsyncStorage.setItem(keys.currentBookshelf, JSON.stringify(current_bookshelf));
	await AsyncStorage.setItem(keys.authToken, auth_token);
	await AsyncStorage.setItem(keys.currentBlogID, "blog-id");
	await AsyncStorage.setItem(keys.blogCount, "1");
	await AsyncStorage.setItem(keys.currentSearch, "keep-current-list");
}

async function storedBookshelf() {
	const value = await AsyncStorage.getItem(keys.currentBookshelf);
	return value == null ? null : JSON.parse(value);
}

function createHomeScreen(navigation) {
	return renderer.create(<HomeScreen navigation={navigation} />, {
		createNodeMock: element => element.type == View ? {} : { clear: jest.fn() }
	});
}

beforeEach(async () => {
	await AsyncStorage.clear();
});

it("does not persist a selected bookshelf until its books load", async () => {
	const shelf_a = { id: "A", title: "Shelf A", books_count: "1 book", type: "reading" };
	const shelf_b = { id: "B", title: "Shelf B", books_count: "2 books", type: "want" };
	await seedHomeStorage([ shelf_a, shelf_b ], shelf_a);

	let resolve_books_request;
	const previous_fetch = global.fetch;
	global.fetch = jest.fn(() => new Promise(resolve => {
		resolve_books_request = resolve;
	}));
	const harness = navigationHarness();
	let screen;

	try {
		await renderer.act(async () => {
			screen = createHomeScreen(harness.navigation);
			await flushAsyncWork();
		});
		await renderer.act(async () => {
			harness.focus();
			await flushAsyncWork();
		});

		expect(screen.root.findByProps({ testID: "bookshelf-popup" }).props.selectedBookshelfID).toBe("A");
		await renderer.act(async () => {
			screen.root.findByProps({ testID: "bookshelf-popup" }).props.onSelect(shelf_b);
			await flushAsyncWork();
		});

		expect(await storedBookshelf()).toEqual(shelf_a);
		expect(screen.root.findByProps({ testID: "bookshelf-popup" }).props.selectedBookshelfID).toBe("A");

		await renderer.act(async () => {
			resolve_books_request({
				json: () => Promise.resolve({
					items: [{
						id: "book-B",
						title: "Book from B",
						image: "https://example.com/book.jpg",
						authors: [{ name: "Author" }],
						_microblog: { isbn: "123" }
					}]
				})
			});
			await flushAsyncWork();
		});

		expect(await storedBookshelf()).toEqual(shelf_b);
		expect(screen.root.findByProps({ testID: "bookshelf-popup" }).props.selectedBookshelfID).toBe("B");
		expect(screen.root.findAll(node => node.props.bookID == "book-B" && node.props.bookshelfID == "B")).not.toHaveLength(0);
	}
	finally {
		global.fetch = previous_fetch;
		await renderer.act(async () => {
			screen?.unmount();
		});
	}
});

it("clears a pending bookshelf after its load fails", async () => {
	const shelf_a = { id: "A", title: "Shelf A", books_count: "1 book", type: "reading" };
	const shelf_b = { id: "B", title: "Shelf B", books_count: "2 books", type: "want" };
	await seedHomeStorage([ shelf_a, shelf_b ], shelf_a);

	let should_fail_b = true;
	const previous_fetch = global.fetch;
	global.fetch = jest.fn(url => {
		if (url == "https://micro.blog/books/bookshelves/B" && should_fail_b) {
			should_fail_b = false;
			return Promise.reject(new Error("Shelf B failed to load"));
		}
		if (url == "https://micro.blog/books/bookshelves") {
			return Promise.resolve({
				json: () => Promise.resolve({
					items: [ shelf_a, shelf_b ].map(shelf => ({
						id: shelf.id,
						title: shelf.title,
						_microblog: { books_count: shelf.id == "A" ? 1 : 2, type: shelf.type }
					}))
				})
			});
		}

		return Promise.resolve({
			json: () => Promise.resolve({ items: [] })
		});
	});
	const harness = navigationHarness();
	let screen;

	try {
		await renderer.act(async () => {
			screen = createHomeScreen(harness.navigation);
			await flushAsyncWork();
		});
		await renderer.act(async () => {
			harness.focus();
			await flushAsyncWork();
		});
		await renderer.act(async () => {
			screen.root.findByProps({ testID: "bookshelf-popup" }).props.onSelect(shelf_b);
			await flushAsyncWork();
		});

		expect(await storedBookshelf()).toEqual(shelf_a);
		expect(screen.root.findByProps({ testID: "bookshelf-popup" }).props.selectedBookshelfID).toBe("A");

		global.fetch.mockClear();
		await AsyncStorage.removeItem(keys.currentSearch);
		await renderer.act(async () => {
			harness.focus();
			await flushAsyncWork(8);
		});

		const requested_urls = global.fetch.mock.calls.map(call => call[0]);
		expect(requested_urls).toContain("https://micro.blog/books/bookshelves/A");
		expect(requested_urls).not.toContain("https://micro.blog/books/bookshelves/B");
		expect(await storedBookshelf()).toEqual(shelf_a);
	}
	finally {
		global.fetch = previous_fetch;
		await renderer.act(async () => {
			screen?.unmount();
		});
	}
});

it("ignores an older account's bookshelf response after a new request starts", async () => {
	const old_shelf = { id: "A", title: "Old Shelf", books_count: "1 book", type: "reading" };
	const new_shelf = { id: "B", title: "New Shelf", books_count: "0 books", type: "want" };
	await seedHomeStorage([ old_shelf ], old_shelf);

	let resolve_old_bookshelves;
	const previous_fetch = global.fetch;
	global.fetch = jest.fn((url, options) => {
		if (url == "https://micro.blog/books/bookshelves") {
			if (options.headers.Authorization == "Bearer old-token") {
				return new Promise(resolve => {
					resolve_old_bookshelves = resolve;
				});
			}

			return Promise.resolve({
				json: () => Promise.resolve({
					items: [{
						id: new_shelf.id,
						title: new_shelf.title,
						_microblog: { books_count: 0, type: new_shelf.type }
					}]
				})
			});
		}

		return Promise.resolve({
			json: () => Promise.resolve({ items: [] })
		});
	});
	const harness = navigationHarness();
	let screen;

	try {
		await renderer.act(async () => {
			screen = createHomeScreen(harness.navigation);
			await flushAsyncWork();
		});
		await renderer.act(async () => {
			harness.focus();
			await flushAsyncWork();
		});

		await AsyncStorage.removeItem(keys.currentSearch);
		await renderer.act(async () => {
			harness.focus();
			await flushAsyncWork();
		});
		expect(resolve_old_bookshelves).toBeDefined();

		await AsyncStorage.removeItem(keys.allBookshelves);
		await AsyncStorage.removeItem(keys.currentBookshelf);
		await AsyncStorage.setItem(keys.authToken, "new-token");
		await renderer.act(async () => {
			harness.focus();
			await flushAsyncWork(8);
		});

		await renderer.act(async () => {
			resolve_old_bookshelves({
				json: () => Promise.resolve({
					items: [{
						id: old_shelf.id,
						title: old_shelf.title,
						_microblog: { books_count: 1, type: old_shelf.type }
					}]
				})
			});
			await flushAsyncWork(8);
		});

		const requested_urls = global.fetch.mock.calls.map(call => call[0]);
		expect(requested_urls).toContain("https://micro.blog/books/bookshelves/B");
		expect(requested_urls).not.toContain("https://micro.blog/books/bookshelves/A");
		expect(await storedBookshelf()).toEqual(new_shelf);
		expect(screen.root.findByProps({ testID: "bookshelf-popup" }).props.selectedBookshelfID).toBe("B");
	}
	finally {
		global.fetch = previous_fetch;
		await renderer.act(async () => {
			screen?.unmount();
		});
	}
});

it("falls back to the first refreshed shelf when the retained shelf is absent", async () => {
	const old_shelf = { id: "A", title: "Old Shelf", books_count: "1 book", type: "reading" };
	const new_shelf = { id: "B", title: "New Shelf", books_count: "0 books", type: "want" };
	await seedHomeStorage([ old_shelf ], old_shelf);

	const previous_fetch = global.fetch;
	global.fetch = jest.fn();
	const harness = navigationHarness();
	let screen;

	try {
		await renderer.act(async () => {
			screen = createHomeScreen(harness.navigation);
			await flushAsyncWork();
		});
		await renderer.act(async () => {
			harness.focus();
			await flushAsyncWork();
		});
		expect(screen.root.findByProps({ testID: "bookshelf-popup" }).props.selectedBookshelfID).toBe("A");

		await AsyncStorage.removeItem(keys.allBookshelves);
		await AsyncStorage.removeItem(keys.currentBookshelf);
		await AsyncStorage.removeItem(keys.currentSearch);
		await AsyncStorage.setItem(keys.authToken, "new-token");
		global.fetch.mockImplementation(url => {
			if (url == "https://micro.blog/books/bookshelves") {
				return Promise.resolve({
					json: () => Promise.resolve({
						items: [{
							id: new_shelf.id,
							title: new_shelf.title,
							_microblog: { books_count: 0, type: new_shelf.type }
						}]
					})
				});
			}

			return Promise.resolve({
				json: () => Promise.resolve({ items: [] })
			});
		});

		await renderer.act(async () => {
			harness.focus();
			await flushAsyncWork(8);
		});

		expect(global.fetch.mock.calls.map(call => call[0])).toContain("https://micro.blog/books/bookshelves/B");
		expect(global.fetch.mock.calls.map(call => call[0])).not.toContain("https://micro.blog/books/bookshelves/A");
		expect(await storedBookshelf()).toEqual(new_shelf);
		expect(screen.root.findByProps({ testID: "bookshelf-popup" }).props.selectedBookshelfID).toBe("B");
	}
	finally {
		global.fetch = previous_fetch;
		await renderer.act(async () => {
			screen?.unmount();
		});
	}
});
