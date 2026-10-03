import RNFS from "react-native-fs";

const cacheDirectory = RNFS.CachesDirectoryPath + "/ProfilePosts";
let pendingWrite = Promise.resolve();

function cachePath(identity) {
	const [, endpoint, blogID] = identity;
	const hostname = (blogID || endpoint).replace(/^https?:\/\//i, "").split(/[/:?#]/)[0].toLowerCase();
	return cacheDirectory + "/Posts-" + encodeURIComponent(hostname) + ".json";
}

export async function readProfilePostsCache(identity) {
	try {
		await pendingWrite;
		const contents = await RNFS.readFile(cachePath(identity), "utf8");
		const cache = JSON.parse(contents);
		if (cache.identity && JSON.stringify(cache.identity) !== JSON.stringify(identity)) {
			return null;
		}
		if (cache.version !== 1 || !Array.isArray(cache.posts) || !cache.posts.every(post =>
			post && (typeof post.id === "string" || Number.isFinite(post.id)) &&
			["url", "text", "display_text", "posted_at", "published_at", "cover_url"]
				.every(key => typeof post[key] === "string")
		)) {
			return null;
		}
		return mergeProfilePosts([], cache.posts);
	}
	catch {
		return null;
	}
}

export function writeProfilePostsCache(identity, posts) {
	const path = cachePath(identity);
	const contents = JSON.stringify({ version: 1, identity, posts });
	// Only completed downloads are saved. Serialize writes with sign-out cleanup.
	pendingWrite = pendingWrite.then(async () => {
		await RNFS.mkdir(cacheDirectory);
		await RNFS.writeFile(path, contents, "utf8");
	}).catch(error => {
		console.log("Error caching profile posts", error);
	});
	return pendingWrite;
}

export function clearProfilePostsCaches() {
	pendingWrite = pendingWrite.then(() => RNFS.unlink(cacheDirectory)).catch(() => {});
	return pendingWrite;
}

export function deleteProfilePostsCache(identity) {
	pendingWrite = pendingWrite.then(() => RNFS.unlink(cachePath(identity))).catch(() => {});
	return pendingWrite;
}

export function mergeProfilePosts(cachedPosts, recentPosts) {
	const postsByID = new Map();
	for (const post of [...cachedPosts, ...recentPosts]) {
		const id = String(post.id);
		postsByID.set(id, { ...post, id });
	}
	return Array.from(postsByID.values()).sort((a, b) =>
		(b.published_at || "").localeCompare(a.published_at || "")
	);
}
