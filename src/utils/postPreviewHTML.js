import { parse } from "parse5";

const htmlNamespace = "http://www.w3.org/1999/xhtml";
const formattingTags = new Set("b blockquote br caption cite code dd del div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 hr i li ol p pre s small span strong sub sup table tbody td th thead tr u ul".split(" "));
const omittedTags = new Set("button form iframe img input noscript object script select style template textarea".split(" "));
const voidTags = new Set(["br", "hr"]);
const escapedCharacters = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

export function webURL(value) {
	if (typeof value !== "string") return null;
	const url = value.trim().replace(/^https?:/i, scheme => scheme.toLowerCase());
	if (!/^https?:\/\/[^/?#@\s\\]+(?:[/?#][^\s\\]*)?$/.test(url)) return null;
	try {
		return new URL(url).hostname ? url : null;
	} catch {
		return null;
	}
}

function escapeHTML(value) {
	return value.replace(/[&<>"]/g, character => escapedCharacters[character]);
}

function attribute(node, name) {
	return node.attrs?.find(attr => attr.name === name && !attr.namespace)?.value;
}

function renderNode(node) {
	if (node.nodeName === "#text") return escapeHTML(node.value);
	const tag = node.tagName;
	if (node.namespaceURI !== htmlNamespace || omittedTags.has(tag)) return "";

	const children = () => node.childNodes.map(renderNode).join("");
	if (!formattingTags.has(tag)) return children();
	return voidTags.has(tag) ? `<${tag}>` : `<${tag}>${children()}</${tag}>`;
}

export function extractPostContent(html) {
	const pending = [parse(html)];
	while (pending.length > 0) {
		const node = pending.pop();
		if (node.namespaceURI === htmlNamespace && attribute(node, "class")?.split(/\s+/).includes("e-content")) {
			return node.childNodes.map(renderNode).join("").trim();
		}
		for (let index = (node.childNodes?.length || 0) - 1; index >= 0; index--) {
			pending.push(node.childNodes[index]);
		}
	}
	return "";
}

// The downloaded page never runs in the WebView. This script reports the
// height of the sanitized preview.
export function postPreviewDocument(content, { dark, fontSize }) {
	return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-preview'; base-uri 'none'; form-action 'none'">
<style>
	html, body { margin: 0; padding: 0; background: transparent; }
	body { color: ${dark ? "#E5E7EB" : "#444444"}; font: ${fontSize}px/1.5 -apple-system, system-ui, sans-serif; overflow-wrap: anywhere; }
	article { display: flow-root; }
	article > :first-child { margin-top: 0; }
	article > :last-child { margin-bottom: 0; }
	figure, blockquote { margin-inline: 12px; }
	pre { white-space: pre-wrap; }
	table { display: block; max-width: 100%; overflow-x: auto; }
</style></head><body>
<article>${content}</article>
<script nonce="preview">
	const article = document.querySelector("article");
	const send = message => window.ReactNativeWebView?.postMessage(JSON.stringify(message));
	const measure = () => send({ height: Math.ceil(article.getBoundingClientRect().height) });
	window.addEventListener("load", () => {
		measure();
		if (window.ResizeObserver) new ResizeObserver(measure).observe(article);
	});
</script></body></html>`;
}
