import React from "react";
import { ActivityIndicator, DeviceEventEmitter, TextInput } from "react-native";
import renderer from "react-test-renderer";

import { keys, libbyConnectedEvent } from "../src/Constants";
import { ConnectLibbyScreen } from "../src/screens/ConnectLibbyScreen";
import storage from "../src/Storage";

let mockBlur;
jest.mock("@react-navigation/native", () => ({
	useFocusEffect: effect => require("react").useEffect(() => {
		mockBlur = effect();
		return () => mockBlur();
	}, [effect])
}));

const baseURL = "https://micro.blog/books/libby";
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, json: async () => data });
const advance = ms => renderer.act(async () => { jest.advanceTimersByTime(ms); });
let screen;
let previousFetch;
let connected;

beforeEach(async () => {
	jest.useFakeTimers();
	await storage.set(keys.authToken, "microblog-token");
	previousFetch = global.fetch;
	global.fetch = jest.fn().mockResolvedValueOnce(response(200, { status: "not_connected" }));
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
	await renderer.act(async () => { screen = renderer.create(<ConnectLibbyScreen />); });
}

async function submitCode(code = "01234567") {
	await renderer.act(async () => screen.root.findByType(TextInput).props.onChangeText(code));
	await renderer.act(async () => screen.root.findByType(TextInput).props.onSubmitEditing());
}

it("sends the code as a string and keeps polling until the imported shelves are ready", async () => {
	global.fetch
		.mockResolvedValueOnce(response(202, { status: "syncing" }))
		.mockResolvedValueOnce(response(200, { status: "syncing" }))
		.mockResolvedValueOnce(response(200, { status: "connected", library_name: "Austin Public Library" }));
	await open();
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
	expect(screen.root.findByProps({ accessibilityRole: "header" }).props.children).toBe("Connected to Austin Public Library");
	expect(connected).toHaveBeenCalledTimes(1);
	await advance(10000);
	expect(global.fetch).toHaveBeenCalledTimes(4);
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

it.each(["blur", "timeout"])("cancels an in-flight status request on %s", async stop => {
	let resolveStatus;
	global.fetch
		.mockResolvedValueOnce(response(202, { status: "syncing" }))
		.mockImplementationOnce(() => new Promise(resolve => { resolveStatus = resolve; }));
	await open();
	await submitCode();
	await advance(2000);
	const signal = global.fetch.mock.calls[2][1].signal;
	if (stop === "blur") {
		await renderer.act(async () => mockBlur());
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
