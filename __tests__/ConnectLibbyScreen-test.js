import React from "react";
import { ActivityIndicator, DeviceEventEmitter, Image, TextInput } from "react-native";
import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import renderer from "react-test-renderer";

import { keys, libbyConnectedEvent } from "../src/Constants";
import { LibbyStack } from "../src/navigation/LibbyStack";
import { ConnectLibbyScreen, LibbyLibraryScreen } from "../src/screens/ConnectLibbyScreen";
import storage from "../src/Storage";

const baseURL = "https://micro.blog/books/libby";
const bookshelvesURL = "https://micro.blog/books/bookshelves";
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, json: async () => data });
const advance = ms => renderer.act(async () => { jest.advanceTimersByTime(ms); });
let screen;
let navigation;
let previousFetch;
let connected;

beforeEach(async () => {
	jest.useFakeTimers();
	await storage.set(keys.authToken, "microblog-token");
	previousFetch = global.fetch;
	global.fetch = jest.fn().mockResolvedValue(response(200, { items: [] }))
		.mockResolvedValueOnce(response(200, { status: "not_connected" }));
	connected = jest.fn();
	connected.subscription = DeviceEventEmitter.addListener(libbyConnectedEvent, connected);
});

afterEach(async () => {
	await renderer.act(async () => screen?.unmount());
	screen = null;
	connected.subscription.remove();
	global.fetch = previousFetch;
	await storage.remove(keys.authToken);
	jest.useRealTimers();
});

async function open() {
	navigation = createNavigationContainerRef();
	await renderer.act(async () => {
		screen = renderer.create(<NavigationContainer ref={navigation}><LibbyStack /></NavigationContainer>);
	});
}

function pressButton(title, screenType = ConnectLibbyScreen) {
	const button = screen.root.findByType(screenType).findAll(node => node.props.accessibilityRole === "button" &&
		typeof node.props.onPress === "function" && node.findAllByProps({ children: title }).length > 0)[0];
	return renderer.act(async () => button.props.onPress());
}

async function submitCode(code = "01234567") {
	await renderer.act(async () => screen.root.findByType(TextInput).props.onChangeText(code));
	await pressButton("Connect");
}

it("sends the code as a string and keeps polling until the imported shelves are ready", async () => {
	global.fetch
		.mockResolvedValueOnce(response(202, { status: "syncing" }))
		.mockResolvedValueOnce(response(200, { status: "syncing" }))
		.mockResolvedValueOnce(response(200, { status: "connected", library_name: "Austin Public Library" }))
		.mockResolvedValueOnce(response(200, { status: "connected", library_name: "Austin Public Library" }));
	await open();
	expect(navigation.getCurrentRoute().name).toBe("ConnectLibby");
	expect(navigation.canGoBack()).toBe(false);
	await submitCode();
	expect(global.fetch).toHaveBeenNthCalledWith(2, `${baseURL}/connect`, expect.objectContaining({
		method: "POST",
		headers: { Authorization: "Bearer microblog-token", "Content-Type": "application/json" },
		body: '{"code":"01234567"}'
	}));
	expect(screen.root.findByType(ActivityIndicator)).toBeDefined();
	await advance(1999);
	expect(global.fetch).toHaveBeenCalledTimes(2);
	await advance(1);
	expect(global.fetch).toHaveBeenNthCalledWith(3, `${baseURL}/status`, expect.objectContaining({
		headers: { Authorization: "Bearer microblog-token" }
	}));
	expect(connected).not.toHaveBeenCalled();
	await advance(2000);
	expect(navigation.getCurrentRoute().name).toBe("LibbyLibrary");
	expect(navigation.canGoBack()).toBe(false);
	expect(screen.root.findByProps({ accessibilityRole: "header" }).props.children).toBe("Connected to Austin Public Library");
	expect(connected).toHaveBeenCalledTimes(1);
	await advance(10000);
	expect(global.fetch.mock.calls.filter(([url]) => url === `${baseURL}/status`)).toHaveLength(4);
});

it("pushes reconnect, then returns to the same library route and reloads its covers", async () => {
	let library = { status: "connected", library_name: "Austin Public Library" };
	global.fetch.mockReset().mockImplementation(async (url) => {
		if (url === `${baseURL}/connect`) {
			library = { status: "connected", library_name: "Seattle Public Library" };
			return response(202, { status: "syncing" });
		}
		return response(200, url === `${baseURL}/status` ? library : { items: [] });
	});
	await open();
	const libraryRoute = navigation.getCurrentRoute();
	expect(screen.root.findByProps({ accessibilityRole: "header" }).props.children).toBe("Connected to Austin Public Library");
	const requestCount = global.fetch.mock.calls.length;
	await pressButton("Reconnect", LibbyLibraryScreen);
	expect(navigation.getCurrentRoute().name).toBe("ConnectLibby");
	expect(navigation.canGoBack()).toBe(true);
	expect(screen.root.findByType(TextInput).props.value).toBe("");
	expect(global.fetch).toHaveBeenCalledTimes(requestCount);
	await renderer.act(async () => navigation.goBack());
	expect(navigation.getCurrentRoute().key).toBe(libraryRoute.key);
	expect(screen.root.findByProps({ accessibilityRole: "header" }).props.children).toBe("Connected to Austin Public Library");
	expect(global.fetch).toHaveBeenCalledTimes(requestCount);
	await pressButton("Reconnect", LibbyLibraryScreen);
	await submitCode("09876543");
	expect(global.fetch).toHaveBeenCalledWith(`${baseURL}/connect`, expect.objectContaining({
		method: "POST",
		body: '{"code":"09876543"}'
	}));
	await advance(2000);
	expect(navigation.getCurrentRoute().key).toBe(libraryRoute.key);
	expect(screen.root.findByProps({ accessibilityRole: "header" }).props.children).toBe("Connected to Seattle Public Library");
	expect(global.fetch.mock.calls.filter(([url]) => url === bookshelvesURL)).toHaveLength(2);
	const refreshedRequestCount = global.fetch.mock.calls.length;
	await pressButton("Reconnect", LibbyLibraryScreen);
	await renderer.act(async () => navigation.goBack());
	expect(global.fetch).toHaveBeenCalledTimes(refreshedRequestCount);
});

it("combines loans and holds into one cover grid and ignores other shelves", async () => {
	const loan = { id: 11, title: "A loan", image: "https://example.com/loan.jpg", _microblog: { isbn: "9780140328721" } };
	const hold = { id: 22, title: "A hold", image: "https://example.com/hold.jpg" };
	const feeds = {
		[`${baseURL}/status`]: { status: "connected", library_name: "Austin Public Library" },
		[bookshelvesURL]: { items: [
			{ id: 1, _microblog: { type: "loans" } },
			{ id: 2, _microblog: { type: "holds" } },
			{ id: 3, _microblog: { type: "reading" } }
		] },
		[`${bookshelvesURL}/1`]: { items: [loan] },
		[`${bookshelvesURL}/2`]: { items: [hold, { ...loan, id: 33 }] }
	};
	global.fetch.mockReset().mockImplementation(async url => response(200, feeds[url]));
	await open();
	expect(screen.root.findAllByType(Image).map(cover => cover.props.source.uri)).toEqual([loan.image, hold.image]);
	expect(global.fetch.mock.calls.map(([url]) => url)).toEqual(Object.keys(feeds));
});

it("keeps a spinner visible through the status check and bookshelf load", async () => {
	let finishStatus;
	let finishBooks;
	global.fetch.mockReset()
		.mockImplementationOnce(() => new Promise(resolve => { finishStatus = resolve; }))
		.mockResolvedValueOnce(response(200, { items: [{ id: 1, _microblog: { type: "loans" } }] }))
		.mockImplementationOnce(() => new Promise(resolve => { finishBooks = resolve; }));
	await open();
	expect(screen.root.findByType(ActivityIndicator).props.accessibilityLabel).toBe("Loading Libby library");
	expect(screen.root.findAllByProps({ children: "Checking your Libby connection…" })).toHaveLength(0);

	await renderer.act(async () => finishStatus(response(200, { status: "connected", library_name: "Austin Public Library" })));
	expect(screen.root.findByType(ActivityIndicator)).toBeDefined();
	expect(screen.root.findAllByProps({ accessibilityRole: "header" })).toHaveLength(0);

	const loan = { id: 1, title: "A loan", image: "https://example.com/loan.jpg" };
	await renderer.act(async () => finishBooks(response(200, { items: [loan] })));
	expect(screen.root.findAllByType(ActivityIndicator)).toHaveLength(0);
	expect(screen.root.findByProps({ accessibilityRole: "header" }).props.children).toBe("Connected to Austin Public Library");
	expect(screen.root.findByType(Image).props.source.uri).toBe(loan.image);
});

it.each([
	[422, { status: "error", message: "Get a new code in Libby." }, null, "Get a new code in Libby."],
	[202, { status: "syncing" }, { status: "error", message: "The library could not sync." }, "The library could not sync."],
	[202, { status: "syncing" }, { status: "not_connected" }, null]
])("returns to code entry on a terminal failure (POST %i, response %j, status %j)", async (httpStatus, postData, statusData, message) => {
	global.fetch.mockResolvedValueOnce(response(httpStatus, postData));
	if (statusData) global.fetch.mockResolvedValueOnce(response(200, statusData));
	await open();
	await submitCode();
	await advance(8000);
	expect(screen.root.findByType(TextInput).props.value).toBe(httpStatus === 202 ? "" : "01234567");
	if (message) expect(screen.root.findByProps({ accessibilityRole: "alert" }).props.children).toBe(message);
	else expect(screen.root.findAllByProps({ accessibilityRole: "alert" })).toHaveLength(0);
	expect(global.fetch).toHaveBeenCalledTimes(statusData ? 3 : 2);
	expect(connected).not.toHaveBeenCalled();
});

it.each(["unmount", "timeout"])("cancels an in-flight status request on %s", async stop => {
	let resolveStatus;
	global.fetch
		.mockResolvedValueOnce(response(202, { status: "syncing" }))
		.mockImplementationOnce(() => new Promise(resolve => { resolveStatus = resolve; }));
	await open();
	await submitCode();
	await advance(2000);
	const signal = global.fetch.mock.calls[2][1].signal;
	if (stop === "unmount") {
		await renderer.act(async () => screen.unmount());
		screen = null;
	} else {
		await advance(297999);
		expect(signal.aborted).toBe(false);
		await advance(1);
		expect(screen.root.findByProps({ accessibilityRole: "alert" }).props.children).toContain("taking longer than expected");
	}
	expect(signal.aborted).toBe(true);
	await renderer.act(async () => resolveStatus(response(200, { status: "connected" })));
	await advance(10000);
	expect(global.fetch).toHaveBeenCalledTimes(3);
	expect(connected).not.toHaveBeenCalled();
});
