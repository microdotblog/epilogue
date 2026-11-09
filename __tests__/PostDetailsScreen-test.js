import React from "react";
import { ActivityIndicator, Linking, StyleSheet, Text } from "react-native";
import renderer from "react-test-renderer";
import { WebView } from "react-native-webview";
import { BookDetailsScreen } from "../src/screens/BookDetailsScreen";
import { PostDetailsScreen } from "../src/screens/PostDetailsScreen";
import { extractPostContent } from "../src/utils/postPreviewHTML";

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
	expect(StyleSheet.flatten(screen.root.findByType(ActivityIndicator).props.style).alignSelf).toBe("center");
	expect(screen.root.findAllByProps({ accessibilityElementsHidden: true }).length).toBeGreaterThan(0);
	expect(screen.root.findAllByProps({ accessibilityRole: "link" })).toHaveLength(0);

	await renderer.act(async () => respond({
		ok: true,
		text: async () => `<!doctype html><article class="h-entry"><div class="js-review-body">Outside post</div><div class="e-content post-body">
			<p>Movie &amp; more<br><a href="../review" onclick="bad()"><strong>Good link</strong></a>
			<p><a href="java&#x73;cript:alert(1)">Bad link</a><img src="/poster.jpg" onerror="bad()">
			<script>untrustedScript()</script><iframe src="https://example.com/embed"></iframe></div>
			<div class="content-reactions-strip"><span>★★★★</span></div></article>`
	}));
	const webview = screen.root.findByType(WebView);
	expect(webview.props.source.html).toContain('<div><span>★★★★</span></div><p>Movie &amp; more<br><strong>Good link</strong>');
	expect(webview.props.source.html).toContain('<p>Bad link');
	expect(webview.props.source.html).not.toMatch(/Outside post|onclick|onerror|javascript:|untrustedScript|<iframe|<img\b|<a\b|href=/i);
	expect(webview.props.onShouldStartLoadWithRequest({ url: "https://example.com/other" })).toBe(false);
	expect(screen.root.findAllByType(ActivityIndicator)).toHaveLength(1);
	expect(screen.root.findAllByProps({ accessibilityElementsHidden: true }).length).toBeGreaterThan(0);
	await renderer.act(async () => webview.props.onMessage({ nativeEvent: { data: '{"height":216}' } }));
	expect(webview.props.containerStyle.height).toBe(216);
	expect(screen.root.findAllByType(ActivityIndicator)).toHaveLength(0);
	expect(screen.root.findAllByProps({ accessibilityElementsHidden: true })).toHaveLength(0);
	expect(screen.root.findAllByProps({ accessibilityRole: "link" }).length).toBeGreaterThan(0);
});

it("moves a nested reactions strip above h-entry content without duplicating it", () => {
	const html = `<header>Outside post</header><article class="post h-entry">
		<p>A <a href="/review">review</a><img src="/poster.jpg"></p>
		<div class="content-reactions-strip"><a href="/rating">★★★★</a></div>
	</article>`;
	expect(extractPostContent(html)).toBe("<div>★★★★</div><p>A review</p>");
});

it("prefers the sanitized review body over h-entry when e-content is missing", () => {
	const html = `<article class="h-entry">
		<header>Outside review</header>
		<div class="review js-review-body"><p>A <a href="/review">review</a><img src="/poster.jpg"></p></div>
	</article>`;
	expect(extractPostContent(html)).toBe("<p>A review</p>");
});

it("shows the Letterboxd SVG rating as text when there is no recognized post body", () => {
	const html = `<header>Outside review</header><div class="content-reactions-strip">
		<span class="inline-symbol inline-rating">
			<svg xmlns="http://www.w3.org/2000/svg" class="glyph -rating" aria-label="★★★" onload="bad()"><title>★★★</title><path d="M0 0"></path></svg>
		</span><img src="/poster.jpg">
	</div>`;
	expect(extractPostContent(html)).toMatch(/^<div><span>\s*★★★\s*<\/span><\/div>$/);
});

it.each(["Details", "PostDetails"])("%s keeps the original link when a page has no recognized post content", async screenName => {
	global.fetch = jest.fn(async () => ({ ok: true, text: async () => "<p>A theme without microformats.</p>" }));
	const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue();
	const book = { isbn: "9780140328721", title: "A Book", author: "An Author",
		image: "https://example.com/book.jpg", description: "", is_search: true,
		bookshelves: [{ id: 1, title: "Want to read" }] };
	await renderer.act(async () => {
		screen = renderer.create(screenName === "Details"
			? <BookDetailsScreen navigation={navigation} route={{ params: { ...book, post } }} />
			: <PostDetailsScreen navigation={navigation} route={{ params: { post, book } }} />);
	});
	const labels = screen.root.findAllByType(Text).map(node => node.props.children);
	expect(labels).toEqual(expect.arrayContaining(["Couldn’t preview this post.", "A Book", "Want to read"]));
	expect(screen.root.findAllByType(WebView)).toHaveLength(0);
	const originalLink = screen.root.findAllByProps({ accessibilityRole: "link" })[0];
	await renderer.act(async () => originalLink.props.onPress());
	expect(openURL).toHaveBeenCalledWith(post.url);
});
