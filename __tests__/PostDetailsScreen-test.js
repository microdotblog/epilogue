import React from "react";
import { Linking, Text } from "react-native";
import renderer from "react-test-renderer";
import { WebView } from "react-native-webview";
import { PostDetailsScreen } from "../src/screens/PostDetailsScreen";

const originalFetch = global.fetch;
const post = { url: "https://example.com/post", author: "Blogger" };
const movie = { title: "A Movie", largeImage: "https://example.com/poster.jpg", overview: "Movie overview." };
const navigation = { setOptions: jest.fn(), addListener: () => () => {} };
let screen;

afterEach(async () => {
	await renderer.act(async () => screen?.unmount());
	global.fetch = originalFetch;
	jest.restoreAllMocks();
});

it("shows details before the post loads and renders only the post body with safe markup", async () => {
	let respond;
	global.fetch = jest.fn(() => new Promise(resolve => { respond = resolve; }));
	await renderer.act(async () => {
		screen = renderer.create(<PostDetailsScreen navigation={navigation} route={{ params: { post, movie } }} />);
	});
	expect(screen.root.findAllByType(Text).some(node => node.props.children === movie.title)).toBe(true);
	expect(screen.root.findAllByType(WebView)).toHaveLength(0);
	expect(global.fetch).toHaveBeenCalledWith(post.url, expect.objectContaining({ credentials: "omit" }));

	await renderer.act(async () => respond({
		ok: true,
		text: async () => `<!doctype html><header>Outside post</header><div class="e-content post-body">
			<p>Movie &amp; more<br><a href="../review" onclick="bad()"><strong>Good link</strong></a>
			<p><a href="java&#x73;cript:alert(1)">Bad link</a><img src="/poster.jpg" onerror="bad()">
			<script>untrustedScript()</script><iframe src="https://example.com/embed"></iframe></div>`
	}));
	const webview = screen.root.findByType(WebView);
	expect(webview.props.source.html).toContain('Movie &amp; more<br><strong>Good link</strong>');
	expect(webview.props.source.html).toContain('<p>Bad link');
	expect(webview.props.source.html).not.toMatch(/Outside post|onclick|onerror|javascript:|untrustedScript|<iframe|<img\b|<a\b|href=/i);
	expect(webview.props.onShouldStartLoadWithRequest({ url: "https://example.com/other" })).toBe(false);
	await renderer.act(async () => webview.props.onMessage({ nativeEvent: { data: '{"height":216}' } }));
	expect(webview.props.containerStyle.height).toBe(216);
});

it("keeps the original link and book details when a page has no e-content", async () => {
	global.fetch = jest.fn(async () => ({ ok: true, text: async () => "<p>A theme without microformats.</p>" }));
	const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue();
	const book = { isbn: "9780140328721", title: "A Book", author: "An Author",
		image: "https://example.com/book.jpg", description: "", is_search: true,
		bookshelves: [{ id: 1, title: "Want to read" }] };
	await renderer.act(async () => {
		screen = renderer.create(<PostDetailsScreen navigation={navigation} route={{ params: { post, book } }} />);
	});
	const labels = screen.root.findAllByType(Text).map(node => node.props.children);
	expect(labels).toEqual(expect.arrayContaining(["Couldn’t preview this post.", "A Book", "Want to read"]));
	expect(screen.root.findAllByType(WebView)).toHaveLength(0);
	const originalLink = screen.root.findAllByProps({ accessibilityRole: "link" })[0];
	await renderer.act(async () => originalLink.props.onPress());
	expect(openURL).toHaveBeenCalledWith(post.url);
});
