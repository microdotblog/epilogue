import RNFS from "react-native-fs";

import { keys } from "./Constants";
import epilogueStorage from "./Storage";

const bookshelvesCacheDirectory = RNFS.CachesDirectoryPath + "/Bookshelves";
const latestBooksCachePath = RNFS.CachesDirectoryPath + "/LatestBooks.json";
const minimumLocalSearchLength = 3;

var isWarmingBookshelfCaches = false;
var hasWarmedBookshelfCaches = false;

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
			description: item.content_text,
			date: item.date_published,
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
	deleteLatestBooksCache();
	RNFS.unlink(bookshelvesCacheDirectory).catch(() => {
	});
}

export function cacheBookshelfDataForID(bookshelf_id, data) {
	return epilogueStorage.get(keys.allBookshelves).then(bookshelves => {
		const bookshelf = (bookshelves || []).find(item => item.id == bookshelf_id);
		if (bookshelf == undefined) {
			return;
		}

		return writeBookshelfCache(bookshelf, data);
	});
}

export function warmAllBookshelfCachesInBackground(bookshelves) {
	if (hasWarmedBookshelfCaches || isWarmingBookshelfCaches) {
		return;
	}

	isWarmingBookshelfCaches = true;
	refreshAllBookshelfCaches(bookshelves)
		.then(() => {
			hasWarmedBookshelfCaches = true;
		})
		.catch(error => {
			console.log("Error warming bookshelf caches", error);
		})
		.finally(() => {
			isWarmingBookshelfCaches = false;
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

function bookshelfCachePath(bookshelf) {
	return bookshelvesCacheDirectory + "/" + bookshelfCacheFilename(bookshelf.title);
}

function ensureBookshelfCacheDirectory() {
	return RNFS.mkdir(bookshelvesCacheDirectory).catch(() => {
	});
}

function writeBookshelfCache(bookshelf, data) {
	return ensureBookshelfCacheDirectory().then(() => {
		const cache = {
			bookshelf: bookshelf,
			feed: data
		};
		return RNFS.writeFile(bookshelfCachePath(bookshelf), JSON.stringify(cache), "utf8");
	}).catch(() => {
	});
}

function refreshAllBookshelfCaches(bookshelves = null) {
	const bookshelf_promise = bookshelves != null ? Promise.resolve(bookshelves) : epilogueStorage.get(keys.allBookshelves);

	return bookshelf_promise.then(saved_bookshelves => {
		const shelves = saved_bookshelves || [];
		if (shelves.length == 0) {
			return;
		}

		return epilogueStorage.get(keys.authToken).then(auth_token => {
			if ((auth_token == null) || (auth_token.length == 0)) {
				return;
			}

			return Promise.all(shelves.map(bookshelf => {
				return refreshBookshelfCache(bookshelf, auth_token);
			}));
		});
	});
}

function refreshBookshelfCache(bookshelf, auth_token) {
	var options = {
		headers: {
			"Authorization": "Bearer " + auth_token
		}
	};

	return fetch("https://micro.blog/books/bookshelves/" + bookshelf.id, options)
		.then(response => response.json())
		.then(data => {
			return writeBookshelfCache(bookshelf, data);
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
