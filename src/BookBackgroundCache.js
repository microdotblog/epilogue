import RNFS from "react-native-fs";

const bookBackgroundCacheDirectory = RNFS.CachesDirectoryPath + "/Backgrounds";
const maximumCachedBackgrounds = 50;

export function cachedBookBackgroundImageURL(isbn) {
	const path = bookBackgroundCachePath(isbn);
	if (path == null) {
		return Promise.resolve(null);
	}

	return RNFS.stat(path).then(() => {
		return "file://" + path;
	}).catch(() => {
		return null;
	});
}

export function cacheBookBackgroundImage(isbn, image_url) {
	const path = bookBackgroundCachePath(isbn);
	if ((path == null) || (typeof image_url != "string") || (image_url.length == 0)) {
		return Promise.resolve();
	}

	return ensureBookBackgroundCacheDirectory().then(() => {
		const download = RNFS.downloadFile({
			fromUrl: image_url,
			toFile: path
		});

		return download.promise.then(result => {
			if ((result.statusCode < 200) || (result.statusCode >= 300)) {
				return RNFS.unlink(path).catch(() => {
				});
			}
		});
	}).then(() => {
		return cleanupBookBackgroundImageCache();
	}).catch(() => {
	});
}

export function cleanupBookBackgroundImageCache() {
	return RNFS.readDir(bookBackgroundCacheDirectory).then(entries => {
		const files = entries.filter(entry => entry.isFile());
		if (files.length <= maximumCachedBackgrounds) {
			return;
		}

		const files_to_delete = files
			.sort((a, b) => cacheEntryTime(b) - cacheEntryTime(a))
			.slice(maximumCachedBackgrounds);

		return Promise.all(files_to_delete.map(entry => {
			return RNFS.unlink(entry.path).catch(() => {
			});
		}));
	}).catch(() => {
	});
}

function ensureBookBackgroundCacheDirectory() {
	return RNFS.mkdir(bookBackgroundCacheDirectory).catch(() => {
	});
}

function bookBackgroundCachePath(isbn) {
	const clean_isbn = sanitizedISBN(isbn);
	if (clean_isbn.length == 0) {
		return null;
	}

	return bookBackgroundCacheDirectory + "/" + clean_isbn + ".png";
}

function sanitizedISBN(isbn) {
	return String(isbn || "").replace(/[^0-9Xx]/g, "");
}

function cacheEntryTime(entry) {
	const date = entry.ctime || entry.mtime;
	const time = date instanceof Date ? date.getTime() : new Date(date).getTime();
	return Number.isNaN(time) ? 0 : time;
}
