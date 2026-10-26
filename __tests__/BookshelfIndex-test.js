const directory = "/tmp/cache/Bookshelves";
const indexPath = "/tmp/cache/BookshelfIndex.json";
const shelves = [{ id: 1, title: "Reading" }, { id: 2, title: "Finished" }];
const isbn = "9780140328721";
const book = (id, isbn) => ({ id, _microblog: { isbn } });
const index = (byISBN = {}, byBookID = {}) => ({ version: 1, byISBN, byBookID });
const tick = () => new Promise(resolve => setImmediate(resolve));
const originalFetch = global.fetch;
let RNFS, storage, cache, files;

beforeEach(() => {
	jest.resetModules();
	RNFS = require("react-native-fs");
	storage = require("../src/Storage").default;
	cache = require("../src/BookshelfCache");
	files = new Map();
	RNFS.readFile.mockImplementation(async path => {
		if (!files.has(path)) throw new Error("Not found");
		return files.get(path);
	});
	RNFS.readDir.mockImplementation(async path => [...files.keys()].filter(file => file.startsWith(path + "/")).map(file => ({
		path: file, name: file.slice(path.length + 1), isFile: () => true
	})));
	RNFS.writeFile.mockImplementation(async (path, contents) => { files.set(path, contents); });
	RNFS.unlink.mockImplementation(async path => {
		for (const file of files.keys()) if (file === path || file.startsWith(path + "/")) files.delete(file);
	});
	jest.spyOn(storage, "get").mockImplementation(async key => key === "bookshelves" ? shelves : "token");
	global.fetch = jest.fn();
});
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

function seedShelf(shelf, items) {
	files.set(`${directory}/${cache.bookshelfCacheFilename(shelf.title)}`, JSON.stringify({ bookshelf: shelf, feed: { items } }));
}

it("reads a saved index once and does no further file I/O for warm lookups", async () => {
	files.set(indexPath, JSON.stringify(index({ [isbn]: [1, 2] }, { "book-1": [2] })));
	expect(await cache.readBookshelfIDsContainingBook("978-0-14-032872-1", " BOOK-1 ")).toEqual([1, 2]);
	expect(RNFS.readFile).toHaveBeenCalledTimes(1);
	expect(RNFS.readDir).not.toHaveBeenCalled();
	RNFS.readFile.mockClear();
	RNFS.writeFile.mockClear();
	for (let i = 0; i < 20; i++) {
		expect(await cache.readBookshelfIDsContainingBook(isbn)).toEqual([1, 2]);
	}
	expect(RNFS.readFile).not.toHaveBeenCalled();
	expect(RNFS.readDir).not.toHaveBeenCalled();
	expect(RNFS.writeFile).not.toHaveBeenCalled();
	expect(global.fetch).not.toHaveBeenCalled();
});

it("rebuilds a missing index on demand from full shelf caches without fetching", async () => {
	seedShelf(shelves[0], [book("book-1", isbn), book("book-1", isbn)]);
	seedShelf(shelves[1], [book("book-2", isbn), book("no-isbn", null)]);
	files.set(`${directory}/broken.json`, "invalid json");
	files.set(`${directory}/invalid-feed.json`, JSON.stringify({ bookshelf: { id: 3 }, feed: { items: {} } }));
	const results = await Promise.all([
		cache.readBookshelfIDsContainingBook(isbn),
		cache.readBookshelfIDsContainingBook(null, "NO-ISBN"),
		cache.readBookshelfIDsContainingBook(null, "missing")
	]);
	expect(results).toEqual([[1, 2], [2], []]);
	expect(RNFS.readDir).toHaveBeenCalledTimes(1);
	expect(RNFS.readFile).toHaveBeenCalledTimes(5); // The index plus four shelf files.
	expect(JSON.parse(files.get(indexPath))).toEqual(index({ [isbn]: [1, 2] }, { "book-1": [1], "book-2": [2], "no-isbn": [2] }));
	expect(global.fetch).not.toHaveBeenCalled();
});

it.each(["invalid json", JSON.stringify({ version: 0 }), JSON.stringify({ version: 1, byISBN: { bad: "not an array" }, byBookID: {} })])(
	"rebuilds an invalid or obsolete index (%s)", async saved => {
		seedShelf(shelves[0], [book("book-1", isbn)]);
		files.set(indexPath, saved);
		expect(await cache.readBookshelfIDsContainingBook(isbn)).toEqual([1]);
		expect(JSON.parse(files.get(indexPath)).version).toBe(1);
	}
);

it("waits for the initial cache check rather than returning unknown membership early", async () => {
	let finishRead;
	RNFS.readFile.mockImplementationOnce(() => new Promise(resolve => { finishRead = resolve; }));
	const done = jest.fn();
	const lookup = cache.readBookshelfIDsContainingBook(isbn).then(done);
	await tick();
	expect(done).not.toHaveBeenCalled();
	finishRead(JSON.stringify(index({ [isbn]: [1] })));
	await lookup;
	expect(done).toHaveBeenCalledWith([1]);
});

it("creates an empty index when no shelf caches exist yet", async () => {
	expect(await cache.readBookshelfIDsContainingBook(isbn)).toEqual([]);
	expect(JSON.parse(files.get(indexPath))).toEqual(index());
});

it("replaces a refreshed shelf's memberships while preserving other shelves", async () => {
	seedShelf(shelves[0], [book("book-1", isbn)]);
	seedShelf(shelves[1], [book("book-2", isbn)]);
	await cache.readBookshelfIDsContainingBook(isbn);
	await cache.cacheBookshelfDataForID(1, { items: [book("new-book", "9780000000002")] });
	expect(await cache.readBookshelfIDsContainingBook(isbn, "book-1")).toEqual([2]);
	expect(await cache.readBookshelfIDsContainingBook(null, "book-1")).toEqual([]);
	expect(await cache.readBookshelfIDsContainingBook("9780000000002")).toEqual([1]);
	expect(JSON.parse(files.get(indexPath))).toEqual(index({ [isbn]: [2], "9780000000002": [1] }, { "book-2": [2], "new-book": [1] }));
	await cache.cacheBookshelfDataForID(2, { items: [] });
	expect(await cache.readBookshelfIDsContainingBook(isbn)).toEqual([]);
});

it("keeps concurrent shelf downloads and index writes in order without lost updates", async () => {
	let activeWrites = 0, maximumWrites = 0;
	RNFS.writeFile.mockImplementation(async (path, contents) => {
		activeWrites += 1;
		maximumWrites = Math.max(maximumWrites, activeWrites);
		await tick();
		files.set(path, contents);
		activeWrites -= 1;
	});
	await Promise.all(shelves.map(shelf => cache.cacheBookshelfDataForID(shelf.id, { items: [book("book-" + shelf.id, isbn)] })));
	expect(await cache.readBookshelfIDsContainingBook(isbn)).toEqual([1, 2]);
	expect(JSON.parse(files.get(indexPath)).byISBN[isbn]).toEqual([1, 2]);
	expect(maximumWrites).toBe(1);
	expect(RNFS.readDir).toHaveBeenCalledTimes(1);
});

it("keeps the in-memory index usable if persisting it fails", async () => {
	files.set(indexPath, JSON.stringify(index()));
	RNFS.writeFile.mockImplementation(async (path, contents) => {
		if (path === indexPath) throw new Error("Disk full");
		files.set(path, contents);
	});
	await cache.cacheBookshelfDataForID(1, { items: [book("book-1", isbn)] });
	expect(await cache.readBookshelfIDsContainingBook(isbn)).toEqual([1]);
});

it("keeps valid memberships if a refresh fails or returns something other than a feed", async () => {
	files.set(indexPath, JSON.stringify(index({ [isbn]: [1] }, { "book-1": [1] })));
	await cache.cacheBookshelfDataForID(1, { error: "Not a feed" });
	global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ items: [] }) });
	cache.refreshAllBookshelfCachesInBackground([shelves[0]]);
	await tick();
	await tick();
	expect(await cache.readBookshelfIDsContainingBook(isbn)).toEqual([1]);
	expect(JSON.parse(files.get(indexPath)).byISBN[isbn]).toEqual([1]);
});

it("clears both the persisted and in-memory index on sign-out", async () => {
	seedShelf(shelves[0], [book("book-1", isbn)]);
	await cache.readBookshelfIDsContainingBook(isbn);
	await cache.clearBookCaches();
	expect(files.has(indexPath)).toBe(false);
	expect([...files.keys()].some(path => path.startsWith(directory))).toBe(false);
	expect(await cache.readBookshelfIDsContainingBook(isbn)).toEqual([]);
	await cache.cacheBookshelfDataForID(2, { items: [book("another-account-book", isbn)] });
	expect(await cache.readBookshelfIDsContainingBook(isbn)).toEqual([2]);
});

it("does not let an old in-flight refresh repopulate the index after sign-out", async () => {
	let finishDownload;
	global.fetch.mockImplementationOnce(() => new Promise(resolve => { finishDownload = resolve; }));
	cache.refreshAllBookshelfCachesInBackground([shelves[0]]);
	await tick();
	expect(global.fetch).toHaveBeenCalledTimes(1);
	await cache.clearBookCaches();
	finishDownload({ json: async () => ({ items: [book("old-account-book", isbn)] }) });
	await tick();
	await tick();
	expect(files.has(indexPath)).toBe(false);
	expect(await cache.readBookshelfIDsContainingBook(isbn)).toEqual([]);
});

it("retains identifier keys safely when they overlap JavaScript object properties", async () => {
	files.set(indexPath, JSON.stringify(index({}, JSON.parse('{"__proto__":[1]}'))));
	expect(await cache.readBookshelfIDsContainingBook(null, "__proto__")).toEqual([1]);
	await cache.cacheBookshelfDataForID(1, { items: [book("constructor", null)] });
	expect(await cache.readBookshelfIDsContainingBook(null, "constructor")).toEqual([1]);
	expect(await cache.readBookshelfIDsContainingBook(null, "__proto__")).toEqual([]);
});
