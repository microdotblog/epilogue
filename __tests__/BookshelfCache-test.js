import { resolveOwningBookshelf } from "../src/BookshelfCache";

const bookshelves = [
	{ id: 1, title: "Currently Reading", type: "reading" },
	{ id: 2, title: "Finished", type: "finished" },
	{ id: 3, title: "Want to Read", type: "want" }
];

it("returns null when the book is not on a bookshelf", () => {
	expect(resolveOwningBookshelf(bookshelves, bookshelves[0], [])).toBeNull();
});

it("selects the bookshelf containing the book", () => {
	expect(resolveOwningBookshelf(bookshelves, bookshelves[0], [2])).toBe(bookshelves[1]);
});

it("prefers the current bookshelf when the book is on multiple shelves", () => {
	expect(resolveOwningBookshelf(bookshelves, bookshelves[1], [1, 2])).toBe(bookshelves[1]);
});

it("uses bookshelf order when the current bookshelf does not contain the book", () => {
	expect(resolveOwningBookshelf(bookshelves, bookshelves[2], [1, 2])).toBe(bookshelves[0]);
});

it("returns null when a cached bookshelf ID cannot be resolved", () => {
	expect(resolveOwningBookshelf(bookshelves, bookshelves[0], [99])).toBeNull();
});
