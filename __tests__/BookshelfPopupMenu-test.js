import React from "react";
import { Dimensions } from "react-native";
import renderer from "react-test-renderer";

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 })
}));

import {
	BOOKSHELF_MENU_ROW_HEIGHT,
	BookshelfPopupMenu,
	bookshelfIndexAtPoint,
	bookshelfMenuCornerRadius,
	bookshelfMenuFrameForAnchor
} from "../src/BookshelfPopupMenu";

const bookshelves = [
	{ id: "1", title: "Currently Reading" },
	{ id: "2", title: "Finished" },
	{ id: "3", title: "Want to Read" }
];

it("matches the system menu corner radius on iOS 26 and later", () => {
	expect(bookshelfMenuCornerRadius("ios", "25.7")).toBe(12);
	expect(bookshelfMenuCornerRadius("ios", "26.0")).toBe(26);
	expect(bookshelfMenuCornerRadius("ios", "27.1")).toBe(26);
	expect(bookshelfMenuCornerRadius("android", 26)).toBe(12);
});

it("positions the popup below the header trigger and clamps it to the screen", () => {
	const below_header = bookshelfMenuFrameForAnchor(
		{ x: 145, y: -44, width: 100, height: 32 },
		bookshelves.length,
		{ width: 390, height: 700 }
	);
	expect(below_header).toEqual({ height: 144, left: 61, top: 5, width: 268 });

	const above_trigger = bookshelfMenuFrameForAnchor(
		{ x: 350, y: 600, width: 40, height: 30 },
		10,
		{ width: 390, height: 700 }
	);
	expect(above_trigger).toEqual({ height: 480, left: 110, top: 114, width: 268 });

	const inset_clamped = bookshelfMenuFrameForAnchor(
		{ x: 175, y: 350, width: 40, height: 30 },
		10,
		{ width: 390, height: 700 },
		34
	);
	expect(inset_clamped).toEqual({ height: 480, left: 61, top: 174, width: 268 });
});

it("maps absolute drag points to rows, including a scrolled menu", () => {
	const frame = { left: 60, top: 100, width: 268, height: BOOKSHELF_MENU_ROW_HEIGHT * 3 };

	expect(bookshelfIndexAtPoint({ x: 80, y: 100 }, frame, 3)).toBe(0);
	expect(bookshelfIndexAtPoint({ x: 80, y: 148 }, frame, 3)).toBe(1);
	expect(bookshelfIndexAtPoint({ x: 80, y: 243 }, frame, 3)).toBe(2);
	expect(bookshelfIndexAtPoint({ x: 80, y: 244 }, frame, 3)).toBeNull();
	expect(bookshelfIndexAtPoint({ x: 59, y: 120 }, frame, 3)).toBeNull();
	expect(bookshelfIndexAtPoint({ x: 80, y: 110 }, frame, 3, BOOKSHELF_MENU_ROW_HEIGHT)).toBe(1);
});

it("handles window dimension changes and removes its listener", async () => {
	let change_handler;
	const remove_listener = jest.fn();
	const dimensions_listener = jest.spyOn(Dimensions, "addEventListener").mockImplementation((event, handler) => {
		change_handler = handler;
		return { remove: remove_listener };
	});
	let screen;

	try {
		await renderer.act(async () => {
			screen = renderer.create(
				<BookshelfPopupMenu bookshelves={bookshelves} onSelect={jest.fn()} selectedBookshelfID="1" />
			);
		});
		expect(change_handler).toEqual(expect.any(Function));

		await renderer.act(async () => {
			change_handler({
				screen: { width: 700, height: 390 },
				window: { width: 700, height: 390 }
			});
		});
	}
	finally {
		await renderer.act(async () => {
			screen?.unmount();
		});
		dimensions_listener.mockRestore();
	}

	expect(remove_listener).toHaveBeenCalledTimes(1);
});
