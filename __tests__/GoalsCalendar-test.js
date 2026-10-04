import React from "react";
import renderer from "react-test-renderer";
import { FlatList, Platform } from "react-native";
import { useScrollToTop } from "@react-navigation/native";
import { GoalsScreen } from "../src/screens/GoalsScreen";
import epilogueStorage from "../src/Storage";

jest.mock("@react-navigation/native", () => ({ useScrollToTop: jest.fn() }));
jest.mock("../src/ProfileHeaderButton", () => ({ useProfileHeader: jest.fn() }));
jest.mock("../src/Storage", () => ({ get: jest.fn(async key => ({
	auth_token: "test-token",
	current_blog_id: "https://example.com/",
	current_blog_name: "example.com"
})[key]) }));
jest.mock("../src/screens/CalendarScreen", () => ({
	CalendarScreen: props => require("react").createElement("CalendarView", props)
}));

const originalOS = Platform.OS;
const originalFetch = global.fetch;
beforeEach(() => epilogueStorage.get.mockImplementation(async key => ({
	auth_token: "test-token",
	current_blog_id: "https://example.com/",
	current_blog_name: "example.com"
})[key]));
afterEach(() => { Platform.OS = originalOS; global.fetch = originalFetch; jest.clearAllMocks(); });

it.each(["ios", "android"])("switches the Goals title segments without navigating on %s", async os => {
	Platform.OS = os;
	global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ items: [] }) }));
	const navigation = { setOptions: jest.fn(), navigate: jest.fn(), addListener: jest.fn(() => () => {}) };
	let screen;
	await renderer.act(async () => { screen = renderer.create(<GoalsScreen navigation={navigation} />); });
	let options = navigation.setOptions.mock.calls.at(-1)[0];
	if (os === "ios") {
		expect(options.unstable_headerRightItems()).toEqual([]);
	} else {
		expect(options.headerRight()).toBeNull();
	}
	const segments = () => options.headerTitle().props.children;
	expect(segments()[0].props.accessibilityState.selected).toBe(true);
	expect(segments()[1].props.accessibilityState.selected).toBe(false);
	expect(screen.root.findAllByType(FlatList)).toHaveLength(1);
	expect(screen.root.findAllByType("CalendarView")).toHaveLength(0);
	await renderer.act(async () => segments()[1].props.onPress());
	options = navigation.setOptions.mock.calls.at(-1)[0];
	expect(segments()[0].props.accessibilityState.selected).toBe(false);
	expect(segments()[1].props.accessibilityState.selected).toBe(true);
	expect(screen.root.findAllByType("CalendarView")).toHaveLength(1);
	expect(useScrollToTop).toHaveBeenLastCalledWith(screen.root.findByType("CalendarView").props.listRef);
	expect(navigation.navigate).not.toHaveBeenCalled();
	await renderer.act(async () => segments()[0].props.onPress());
	expect(useScrollToTop).not.toHaveBeenLastCalledWith(screen.root.findByType("CalendarView").props.listRef);
	expect(screen.root.findAllByType("CalendarView")).toHaveLength(1);
	expect(screen.root.findAllByType(FlatList)).toHaveLength(1);
	await renderer.act(async () => screen.unmount());
});

it("keeps the loaded calendar when returning from a book, but rechecks pages after opening the editor", async () => {
	Platform.OS = "ios";
	global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ items: [] }) }));
	let onFocus;
	const navigation = {
		setOptions: jest.fn(), navigate: jest.fn(),
		addListener: jest.fn((event, listener) => {
			if (event === "focus") onFocus = listener;
			return () => {};
		})
	};
	let screen;
	await renderer.act(async () => { screen = renderer.create(<GoalsScreen navigation={navigation} />); });
	await renderer.act(async () => navigation.setOptions.mock.calls.at(-1)[0].headerTitle().props.children[1].props.onPress());
	expect(global.fetch).toHaveBeenCalledTimes(1);
	await renderer.act(async () => onFocus());
	expect(global.fetch).toHaveBeenCalledTimes(1);
	expect(screen.root.findByType("CalendarView").props.pageLoading).toBe(false);
	navigation.setOptions.mock.calls.at(-1)[0].unstable_headerRightItems()[0].onPress();
	await renderer.act(async () => onFocus());
	expect(global.fetch).toHaveBeenCalledTimes(2);
	await renderer.act(async () => screen.unmount());
});

it.each([
	["another blog", "https://other.example/", "other.example"],
	["the default blog", null, null],
	["a renamed blog", "https://example.com/", "renamed.example"]
])("rechecks calendar pages after switching to %s in Profile", async (_, blogID, blogName) => {
	Platform.OS = "ios";
	let resolveList;
	global.fetch = jest.fn()
		.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [
			{ properties: { uid: [77], name: ["Old calendar"], content: ['{{< bookcalendar view="list" >}}'] } }
		] }) })
		.mockImplementationOnce(() => new Promise(resolve => { resolveList = resolve; }));
	let onFocus;
	const navigation = {
		setOptions: jest.fn(), navigate: jest.fn(),
		addListener: jest.fn((event, listener) => {
			if (event === "focus") onFocus = listener;
			return () => {};
		})
	};
	let screen;
	await renderer.act(async () => { screen = renderer.create(<GoalsScreen navigation={navigation} />); });
	await renderer.act(async () => navigation.setOptions.mock.calls.at(-1)[0].headerTitle().props.children[1].props.onPress());
	expect(navigation.setOptions.mock.calls.at(-1)[0].unstable_headerRightItems()[0].label).toBe("Edit Page");

	epilogueStorage.get.mockImplementation(async key => ({
		auth_token: "test-token", current_blog_id: blogID, current_blog_name: blogName
	})[key]);
	await renderer.act(async () => { onFocus(); });
	expect(global.fetch).toHaveBeenCalledTimes(2);
	const destination = blogID ? `&mp-destination=${encodeURIComponent(blogID)}` : "";
	expect(global.fetch).toHaveBeenLastCalledWith(
		`https://micro.blog/micropub?q=source&mp-channel=pages${destination}&limit=100&offset=0`,
		{ headers: { Authorization: "Bearer test-token" } }
	);
	expect(navigation.setOptions.mock.calls.at(-1)[0].unstable_headerRightItems()).toEqual([]);
	expect(screen.root.findByType("CalendarView").props.pageLoading).toBe(true);

	await renderer.act(async () => resolveList({ ok: true, json: async () => ({ items: [] }) }));
	const button = navigation.setOptions.mock.calls.at(-1)[0].unstable_headerRightItems()[0];
	expect(button.label).toBe("New Page");
	button.onPress();
	expect(navigation.navigate).toHaveBeenLastCalledWith("Post", expect.objectContaining({
		calendarPage: null, calendarBlogID: blogID || "", calendarBlogName: blogName || ""
	}));
	await renderer.act(async () => screen.unmount());
});

it("keeps the center spinner while checking pages, then offers the edit icon", async () => {
	Platform.OS = "ios";
	let resolveList;
	global.fetch = jest.fn(() => new Promise(resolve => { resolveList = resolve; }));
	const navigation = { setOptions: jest.fn(), navigate: jest.fn(), addListener: jest.fn(() => () => {}) };
	let screen;
	await renderer.act(async () => { screen = renderer.create(<GoalsScreen navigation={navigation} />); });
	let options = navigation.setOptions.mock.calls.at(-1)[0];
	await renderer.act(async () => options.headerTitle().props.children[1].props.onPress());
	options = navigation.setOptions.mock.calls.at(-1)[0];
	expect(options.unstable_headerRightItems()).toEqual([]);
	expect(screen.root.findByType("CalendarView").props.pageLoading).toBe(true);
	expect(global.fetch).toHaveBeenCalledWith(
		"https://micro.blog/micropub?q=source&mp-channel=pages&mp-destination=https%3A%2F%2Fexample.com%2F&limit=100&offset=0",
		{ headers: { Authorization: "Bearer test-token" } }
	);
	await renderer.act(async () => resolveList({ ok: true, json: async () => ({ items: [
		{ properties: { uid: [77], name: ["Reading Notes"], url: ["https://example.com/my-reading/"], content: ['{{< bookcalendar view="list" >}}'] } }
	] }) }));
	options = navigation.setOptions.mock.calls.at(-1)[0];
	const button = options.unstable_headerRightItems()[0];
	expect(button).toMatchObject({ type: "button", label: "Edit Page", icon: { type: "sfSymbol", name: "square.and.pencil" } });
	expect(screen.root.findByType("CalendarView").props.pageLoading).toBe(false);
	button.onPress();
	expect(navigation.navigate).toHaveBeenCalledWith("Post", expect.objectContaining({
		calendarMode: true,
		calendarBlogID: "https://example.com/",
		calendarPage: expect.objectContaining({ uid: 77, url: "https://example.com/my-reading/", title: "Reading Notes" })
	}));
	await renderer.act(async () => screen.unmount());
});

it("offers New Page when there is no calendar page", async () => {
	Platform.OS = "android";
	global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ items: [] }) }));
	const navigation = { setOptions: jest.fn(), navigate: jest.fn(), addListener: jest.fn(() => () => {}) };
	let screen;
	await renderer.act(async () => { screen = renderer.create(<GoalsScreen navigation={navigation} />); });
	let options = navigation.setOptions.mock.calls.at(-1)[0];
	await renderer.act(async () => options.headerTitle().props.children[1].props.onPress());
	options = navigation.setOptions.mock.calls.at(-1)[0];
	const button = options.headerRight();
	expect(button.props.accessibilityLabel).toBe("New Page");
	expect(button.props.children.props.name).toBe("publish");
	button.props.onPress();
	expect(navigation.navigate).toHaveBeenCalledWith("Post", expect.objectContaining({ calendarMode: true, calendarPage: null }));
	await renderer.act(async () => screen.unmount());
});
