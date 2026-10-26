import RNFS from "react-native-fs";

import { keys } from "./Constants";
import epilogueStorage from "./Storage";

const bookshelvesCacheDirectory = RNFS.CachesDirectoryPath + "/Bookshelves";
const latestBooksCachePath = RNFS.CachesDirectoryPath + "/LatestBooks.json";
const bookshelfIndexPath = RNFS.CachesDirectoryPath + "/BookshelfIndex.json";
const minimumLocalSearchLength = 3;

var isWarmingBookshelfCaches = false;
var hasWarmedBookshelfCaches = false;
var bookshelfIndex = null;
var bookshelfCacheQueue = Promise.resolve();
var bookshelfCacheGeneration = 0;

export function booksFromJSONFeed(data, bookshelf = null) {
	var new_items = [];
	for (let item of data.items || []) {
		const metadata = item._microblog || {};
		var author_name = "";
		if ((item.authors != undefined) && (item.authors.length > 0)) {
			author_name = item.authors[0].name;
		}

		var book = {
			id: item.id,
			isbn: metadata.isbn,
			title: item.title,
			image: item.image,
			author: author_name,
			author_id: metadata.author_id,
			description: item.content_text,
			date: item.date_published,
			background_color: metadata.background_color,
			background_url: metadata.background_url,
			is_search: false
		};

		if (bookshelf != null) {
			book.bookshelf = bookshelf;
			book.bookshelf_id = bookshelf.id;
			book.bookshelf_name = bookshelf.title;
			book.bookshelf_type = bookshelf.type;
			book.list_id = bookshelf.id + ":" + item.id;
		}

		new_items.push(book);
	}
	return new_items;
}

export function bookshelfCacheFilename(title) {
	var name = (title || "bookshelf")
		.toLowerCase()
		.replace(/\s+/g, "")
		.replace(/[\/\\?%*:|"<>]/g, "");

	if (name.length == 0) {
		name = "bookshelf";
	}

	return name + ".json";
}

export function readLatestBooksCache() {
	return RNFS.readFile(latestBooksCachePath, "utf8").then(contents => {
		return JSON.parse(contents);
	});
}

export function writeLatestBooksCache(data) {
	return RNFS.writeFile(latestBooksCachePath, JSON.stringify(data), "utf8").catch(() => {
	});
}

export function deleteLatestBooksCache() {
	return RNFS.unlink(latestBooksCachePath).catch(() => {
	});
}

export function clearBookCaches() {
	bookshelfCacheGeneration += 1;
	hasWarmedBookshelfCaches = false;
	isWarmingBookshelfCaches = false;
	return queueBookshelfCacheTask(async () => {
		bookshelfIndex = null;
		await Promise.all([
			deleteLatestBooksCache(),
			RNFS.unlink(bookshelvesCacheDirectory).catch(() => {}),
			RNFS.unlink(bookshelfIndexPath).catch(() => {})
		]);
	});
}

export function cacheBookshelfDataForID(bookshelf_id, data) {
	const generation = bookshelfCacheGeneration;
	return epilogueStorage.get(keys.allBookshelves).then(bookshelves => {
		const bookshelf = (bookshelves || []).find(item => item.id == bookshelf_id);
		if (bookshelf == undefined) {
			return;
		}

		return writeBookshelfCache(bookshelf, data, generation);
	});
}

export function warmAllBookshelfCachesInBackground(bookshelves) {
	if (hasWarmedBookshelfCaches || isWarmingBookshelfCaches) {
		return;
	}

	isWarmingBookshelfCaches = true;
	const generation = bookshelfCacheGeneration;
	refreshAllBookshelfCaches(bookshelves)
		.then(() => {
			if (generation === bookshelfCacheGeneration) hasWarmedBookshelfCaches = true;
		})
		.catch(error => {
			console.log("Error warming bookshelf caches", error);
		})
		.finally(() => {
			if (generation === bookshelfCacheGeneration) isWarmingBookshelfCaches = false;
		});
}

export function refreshAllBookshelfCachesInBackground(bookshelves = null) {
	refreshAllBookshelfCaches(bookshelves)
		.catch(error => {
			console.log("Error refreshing bookshelf caches", error);
		});
}

export function searchCachedBookshelves(searchText, fallbackBooks = [], fallbackBookshelf = null) {
	const query = searchText.trim().toLowerCase();
	if (query.length < minimumLocalSearchLength) {
		return Promise.resolve([]);
	}

	return RNFS.readDir(bookshelvesCacheDirectory).then(entries => {
		const json_files = entries.filter(entry => entry.isFile() && entry.name.endsWith(".json"));
		const reads = json_files.map(entry => {
			return RNFS.readFile(entry.path, "utf8")
				.then(contents => {
					const cached = JSON.parse(contents);
					const feed = cached.feed || cached;
					const bookshelf = cached.bookshelf || {
						id: entry.name,
						title: entry.name.replace(".json", ""),
						type: ""
					};
					return matchingBooksFromFeed(feed, bookshelf, query);
				})
				.catch(() => {
					return [];
				});
		});

		return Promise.all(reads).then(results => {
			return mergeBookMatches(results.flat(), fallbackMatches(fallbackBooks, fallbackBookshelf, query));
		});
	}).catch(() => {
		return fallbackMatches(fallbackBooks, fallbackBookshelf, query);
	});
}

export function readBookshelfIDsContainingBook(isbn, bookID = null) {
	const target_isbn = normalizedBookKey(isbn).replace(/[-\s]/g, "");
	const target_id = normalizedBookKey(bookID);
	if ((target_isbn.length == 0) && (target_id.length == 0)) {
		return Promise.resolve([]);
	}

	const generation = bookshelfCacheGeneration;
	return queueBookshelfCacheTask(async () => {
		if (generation !== bookshelfCacheGeneration) return [];
		const index = await loadBookshelfIndex();
		if (generation !== bookshelfCacheGeneration) return [];
		const ids = (index.byISBN[target_isbn] || []).concat(index.byBookID[target_id] || []);
		return Array.from(new Map(ids.map(id => [String(id), id])).values());
	}).catch(() => {
		return [];
	});
}

// Serialize cache writes and index initialization so concurrent shelf downloads
// cannot overwrite one another's memberships or race cache clearing on sign-out.
function queueBookshelfCacheTask(task) {
	const result = bookshelfCacheQueue.then(task);
	bookshelfCacheQueue = result.catch(() => {});
	return result;
}

function validIndexMap(value) {
	return value != null && typeof value === "object" && !Array.isArray(value) &&
		Object.values(value).every(ids => Array.isArray(ids) && ids.every(id =>
			typeof id === "string" || (typeof id === "number" && Number.isFinite(id))));
}

async function loadBookshelfIndex() {
	if (bookshelfIndex != null) return bookshelfIndex;
	try {
		const saved = JSON.parse(await RNFS.readFile(bookshelfIndexPath, "utf8"));
		if (saved.version === 1 && validIndexMap(saved.byISBN) && validIndexMap(saved.byBookID)) {
			bookshelfIndex = {
				version: 1,
				byISBN: Object.assign(Object.create(null), saved.byISBN),
				byBookID: Object.assign(Object.create(null), saved.byBookID)
			};
			return bookshelfIndex;
		}
	} catch (_) {}

	// Missing, corrupt, or outdated: scan the full feeds once, then reuse the index.
	const index = { version: 1, byISBN: Object.create(null), byBookID: Object.create(null) };
	const entries = await RNFS.readDir(bookshelvesCacheDirectory).catch(() => []);
	const cachedShelves = await Promise.all(entries.filter(entry => entry.isFile() && entry.name.endsWith(".json")).map(async entry => {
		try { return JSON.parse(await RNFS.readFile(entry.path, "utf8")); }
		catch (_) { return null; }
	}));
	for (const cached of cachedShelves) {
		const feed = cached?.feed || cached;
		if (cached?.bookshelf?.id != null && Array.isArray(feed?.items)) replaceIndexedBookshelf(index, cached.bookshelf.id, feed);
	}
	bookshelfIndex = index;
	await saveBookshelfIndex();
	return index;
}

function saveBookshelfIndex() {
	return RNFS.writeFile(bookshelfIndexPath, JSON.stringify(bookshelfIndex), "utf8").catch(() => {});
}

function replaceIndexedBookshelf(index, shelfID, feed) {
	// Replace, rather than append, so books removed from this shelf lose the checkmark.
	for (const map of [index.byISBN, index.byBookID]) {
		for (const key of Object.keys(map)) {
			map[key] = map[key].filter(id => String(id) !== String(shelfID));
			if (map[key].length === 0) delete map[key];
		}
	}
	for (const item of Array.isArray(feed?.items) ? feed.items : []) {
		const isbn = normalizedBookKey(item?._microblog?.isbn).replace(/[-\s]/g, "");
		const id = normalizedBookKey(item?.id);
		for (const [map, key] of [[index.byISBN, isbn], [index.byBookID, id]]) {
			if (key.length === 0) continue;
			if (!map[key]) map[key] = [];
			if (!map[key].some(id => String(id) === String(shelfID))) map[key].push(shelfID);
		}
	}
}

export function resolveOwningBookshelf(bookshelves, currentBookshelf, bookshelfIDs) {
	const shelf_ids = new Set((bookshelfIDs || []).map(shelf_id => String(shelf_id)));
	const saved_bookshelves = bookshelves || [];

	if ((currentBookshelf?.id != null) && shelf_ids.has(String(currentBookshelf.id))) {
		return saved_bookshelves.find(bookshelf => String(bookshelf.id) == String(currentBookshelf.id)) || currentBookshelf;
	}

	return saved_bookshelves.find(bookshelf => shelf_ids.has(String(bookshelf.id))) || null;
}

function bookshelfCachePath(bookshelf) {
	return bookshelvesCacheDirectory + "/" + bookshelfCacheFilename(bookshelf.title);
}

function ensureBookshelfCacheDirectory() {
	return RNFS.mkdir(bookshelvesCacheDirectory).catch(() => {
	});
}

function writeBookshelfCache(bookshelf, data, generation) {
	if (!Array.isArray(data?.items)) return Promise.resolve();
	return queueBookshelfCacheTask(async () => {
		if (generation !== bookshelfCacheGeneration) return;
		const index = await loadBookshelfIndex();
		await ensureBookshelfCacheDirectory();
		const cache = {
			bookshelf: bookshelf,
			feed: data
		};
		await RNFS.writeFile(bookshelfCachePath(bookshelf), JSON.stringify(cache), "utf8");
		replaceIndexedBookshelf(index, bookshelf.id, data);
		await saveBookshelfIndex();
	}).catch(() => {
	});
}

function refreshAllBookshelfCaches(bookshelves = null) {
	const generation = bookshelfCacheGeneration;
	const bookshelf_promise = bookshelves != null ? Promise.resolve(bookshelves) : epilogueStorage.get(keys.allBookshelves);

	return bookshelf_promise.then(saved_bookshelves => {
		const shelves = saved_bookshelves || [];
		if (shelves.length == 0) {
			return;
		}

		return epilogueStorage.get(keys.authToken).then(auth_token => {
			if ((auth_token == null) || (auth_token.length == 0) || generation !== bookshelfCacheGeneration) {
				return;
			}

			return Promise.all(shelves.map(bookshelf => {
				return refreshBookshelfCache(bookshelf, auth_token, generation);
			}));
		});
	});
}

function refreshBookshelfCache(bookshelf, auth_token, generation) {
	var options = {
		headers: {
			"Authorization": "Bearer " + auth_token
		}
	};

	return fetch("https://micro.blog/books/bookshelves/" + bookshelf.id, options)
		.then(response => {
			if (response.ok === false) throw new Error("Could not refresh bookshelf cache");
			return response.json();
		})
		.then(data => {
			return writeBookshelfCache(bookshelf, data, generation);
		})
		.catch(() => {
		});
}

function matchingBooksFromFeed(feed, bookshelf, query) {
	return booksFromJSONFeed(feed, bookshelf).filter(book => {
		return bookMatchesQuery(book, query);
	}).map(book => ({
		...book,
		is_bookshelf_match: true,
		bookshelf_name: bookshelf.title
	}));
}

function fallbackMatches(fallbackBooks, fallbackBookshelf, query) {
	if (fallbackBookshelf == null) {
		return [];
	}

	return fallbackBooks.filter(book => {
		return bookMatchesQuery(book, query);
	}).map(book => ({
		...book,
		bookshelf: fallbackBookshelf,
		bookshelf_id: fallbackBookshelf.id,
		bookshelf_name: fallbackBookshelf.title,
		bookshelf_type: fallbackBookshelf.type,
		list_id: fallbackBookshelf.id + ":" + book.id,
		is_bookshelf_match: true
	}));
}

function bookMatchesQuery(book, query) {
	const book_title = (book.title || "").toLowerCase();
	const book_author = (book.author || "").toLowerCase();
	return book_title.includes(query) || book_author.includes(query);
}

function normalizedBookKey(value) {
	if (value == null) {
		return "";
	}

	return String(value).trim().toLowerCase();
}

function mergeBookMatches(cacheMatches, fallbackMatches) {
	var matches = [];
	var seen = new Set();
	for (let book of cacheMatches.concat(fallbackMatches)) {
		const key = (book.bookshelf_id || "") + ":" + book.id;
		if (!seen.has(key)) {
			seen.add(key);
			matches.push(book);
		}
	}
	return matches;
}
