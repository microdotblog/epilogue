import RNFS from "react-native-fs";
import { readProfilePostsCache, writeProfilePostsCache, deleteProfilePostsCache, clearProfilePostsCaches, mergeProfilePosts } from "../src/ProfilePostsCache";

const identity = ["reader", "https://micro.blog/micropub", "blog-one"];
const posts = [{
	id: "1", url: "https://example.com/1", text: "A post", display_text: "A post",
	posted_at: "2026-09-26", published_at: "2026-09-26T12:00:00Z", cover_url: ""
}];
let files;

beforeEach(() => {
	jest.clearAllMocks();
	files = new Map();
	RNFS.readFile.mockImplementation(async path => {
		if (!files.has(path)) throw new Error("Not found");
		return files.get(path);
	});
	RNFS.writeFile.mockImplementation(async (path, text) => { files.set(path, text); });
	RNFS.unlink.mockImplementation(async path => {
		for (const key of files.keys()) {
			if (key === path || key.startsWith(path + "/")) files.delete(key);
		}
	});
});

it("isolates files by account, endpoint, and blog and replaces the saved list", async () => {
	await writeProfilePostsCache(identity, posts);
	expect(await readProfilePostsCache(identity)).toEqual(posts);
	expect(await readProfilePostsCache(["other", identity[1], identity[2]])).toBeNull();
	expect(await readProfilePostsCache([identity[0], "https://example.com/micropub", identity[2]])).toBeNull();
	expect(await readProfilePostsCache([identity[0], identity[1], "blog-two"])).toBeNull();
	await writeProfilePostsCache(identity, []);
	expect(await readProfilePostsCache(identity)).toEqual([]);
});

it.each(["not json", "{}", '{"version":1,"posts":[{}]}'])("ignores an invalid cache: %s", async contents => {
	RNFS.readFile.mockResolvedValueOnce(contents);
	expect(await readProfilePostsCache(identity)).toBeNull();
});

it("only reads and writes Posts-hostname.json", async () => {
	const blog = ["reader", "https://micro.blog/micropub", "https://manton.micro.blog/"];
	const oldPath = RNFS.CachesDirectoryPath + "/ProfilePosts/" + encodeURIComponent(JSON.stringify(blog)) + ".json";
	const newPath = RNFS.CachesDirectoryPath + "/ProfilePosts/Posts-manton.micro.blog.json";
	files.set(oldPath, JSON.stringify({ version: 1, posts }));
	expect(await readProfilePostsCache(blog)).toBeNull();
	expect(RNFS.readFile).toHaveBeenCalledTimes(1);
	expect(RNFS.readFile).toHaveBeenCalledWith(newPath, "utf8");
	await writeProfilePostsCache(blog, posts);
	expect(files.has(newPath)).toBe(true);
	expect(files.has(oldPath)).toBe(true);
	expect(await readProfilePostsCache(blog)).toEqual(posts);
});

it("reads numeric IDs from existing files and merges numeric and string IDs as the same post", async () => {
	await writeProfilePostsCache(identity, [{ ...posts[0], id: 1 }]);
	const cached = await readProfilePostsCache(identity);
	expect(cached).toEqual(posts);
	expect(mergeProfilePosts(cached, [{ ...posts[0], id: 1, display_text: "Updated" }]))
		.toEqual([{ ...posts[0], display_text: "Updated" }]);
});

it("invalidates only the edited blog and clears all files on sign-out", async () => {
	const otherBlog = [...identity.slice(0, 2), "blog-two"];
	await writeProfilePostsCache(identity, posts);
	await writeProfilePostsCache(otherBlog, posts);
	await deleteProfilePostsCache(identity);
	expect(await readProfilePostsCache(identity)).toBeNull();
	expect(await readProfilePostsCache(otherBlog)).toEqual(posts);
	// Cleanup also waits for a write already in progress.
	const write = writeProfilePostsCache(identity, posts);
	await clearProfilePostsCaches();
	await write;
	expect(files.size).toBe(0);
});
