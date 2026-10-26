import { isBookISBN, normalizedISBN } from "../src/ISBN";
import { Book } from "../src/models/Book";

const isbn = "9780140328721";
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

it("validates book EAN-13 checksums and normalizes printed ISBNs", () => {
	expect(normalizedISBN("978-0-14-032872-1")).toBe(isbn);
	expect(Book.isISBN("978-0-14-032872-1")).toBe(true);
	expect(isBookISBN("9791032303955")).toBe(true);
	for (const value of [null, "", "0140328726", "9780140328722", "1234567890128", "51495", "https://example.com", "9790000000001"]) {
		expect(isBookISBN(value)).toBe(false);
	}
});

it("looks up the exact edition and retains the scanned ISBN", async () => {
	global.fetch = jest.fn(async url => ({ ok: true, json: async () => url.includes("/isbn/") ? {
		key: "/books/OL7353617M", title: "Matilda", isbn_13: ["9789999999996"],
		authors: [{ key: "/authors/OL34184A" }], covers: [-1, 123],
		works: [{ key: "/works/OL45804W" }], description: { value: "A story." }
	} : { name: "Roald Dahl" } }));
	const result = await Book.findByISBN("978-0-14-032872-1");
	expect(global.fetch.mock.calls.map(call => call[0])).toEqual([
		`https://openlibrary.org/isbn/${isbn}.json`, "https://openlibrary.org/authors/OL34184A.json"
	]);
	expect(result).toMatchObject({ isbn, id: "/books/OL7353617M", title: "Matilda", author: "Roald Dahl",
		work_key: "OL45804W", cover_url: "https://covers.openlibrary.org/b/id/123-M.jpg", description: "A story." });
});

it("can return a book without author or cover metadata", async () => {
	global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ title: "Matilda" }) }));
	expect(await Book.findByISBN(isbn)).toMatchObject({ isbn, id: isbn, author: "", cover_url: Book.coverFromOpenLibraryISBN(isbn) });
});

it("allows failed author metadata without losing the scanned book", async () => {
	global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ title: "Matilda", authors: [{ key: "/authors/OL34184A" }] }) })
		.mockRejectedValueOnce(new Error("Offline"));
	expect(await Book.findByISBN(isbn)).toMatchObject({ isbn, author: "" });
});

it("distinguishes missing books from network errors and rejects invalid scans before fetching", async () => {
	global.fetch = jest.fn(async () => ({ status: 404 }));
	expect(await Book.findByISBN(isbn)).toBe(null);
	global.fetch.mockResolvedValue({ ok: false, status: 503 });
	await expect(Book.findByISBN(isbn)).rejects.toThrow();
	global.fetch.mockClear();
	expect(await Book.findByISBN("51495")).toBe(null);
	expect(global.fetch).not.toHaveBeenCalled();
});

it("passes cancellation through edition and author requests", async () => {
	const controller = new AbortController();
	global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ title: "Matilda", authors: [{ key: "/authors/OL34184A" }] }) })
		.mockImplementationOnce(async () => { controller.abort(); throw new Error("Aborted"); });
	await expect(Book.findByISBN(isbn, controller.signal)).rejects.toThrow("Aborted");
	expect(global.fetch.mock.calls.every(call => call[1].signal === controller.signal)).toBe(true);
});
