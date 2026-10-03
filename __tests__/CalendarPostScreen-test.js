import React from "react";
import renderer from "react-test-renderer";
import { InputAccessoryView, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { PostScreen } from "../src/screens/PostScreen";
import HighlightingText from "../src/components/text/highlighting_text";
import epilogueStorage from "../src/Storage";

jest.mock("@react-navigation/elements", () => ({ useHeaderHeight: () => 0 }));
jest.mock("../src/Storage", () => ({ get: jest.fn(async key => key === "auth_token" ? "test-token" : null), set: jest.fn() }));

const originalOS = Platform.OS;
const originalFetch = global.fetch;
afterEach(() => { Platform.OS = originalOS; global.fetch = originalFetch; jest.clearAllMocks(); });

async function openCalendarEditor(calendarPage, os = "android") {
	Platform.OS = os;
	let onFocus;
	const navigation = {
		addListener: jest.fn((event, listener) => { if (event === "focus") onFocus = listener; return () => {}; }),
		setOptions: jest.fn(),
		goBack: jest.fn(),
		navigate: jest.fn()
	};
	let screen;
	await renderer.act(async () => {
		screen = renderer.create(<PostScreen navigation={navigation} route={{ params: {
			books: [], calendarMode: true, calendarPage,
			calendarBlogID: "https://example.com/", calendarBlogName: "example.com"
		} }} />);
	});
	await renderer.act(async () => onFocus());
	jest.spyOn(screen.root.findByType(HighlightingText).instance, "getText").mockImplementation(async () => screen.root.findByType(HighlightingText).props.value);
	return { screen, navigation, submit: () => navigation.setOptions.mock.calls.at(-1)[0].headerRight() };
}

it("keeps the calendar notice in the iOS editor instead of a keyboard accessory", async () => {
	let keyboardFrameChanged;
	const keyboardListener = jest.spyOn(Keyboard, "addListener").mockImplementation((event, callback) => {
		if (event === "keyboardWillChangeFrame") keyboardFrameChanged = callback;
		return { remove: jest.fn() };
	});
	const { screen } = await openCalendarEditor(null, "ios");
	expect(screen.root.findByType(HighlightingText).props.autoFocus).toBe(true);
	expect(screen.root.findAllByType(InputAccessoryView)).toHaveLength(0);
	expect(screen.root.findAllByType(Text).some(item => item.props.children === "Share the book calendar on your blog.")).toBe(true);
	await renderer.act(async () => keyboardFrameChanged({ endCoordinates: { height: 320 } }));
	expect(screen.root.findByType(KeyboardAvoidingView).props.style).toContainEqual({ paddingBottom: 320 });
	const notice = screen.root.findAllByType(Text).find(item => item.props.children === "Share the book calendar on your blog.");
	const keyboardFill = screen.root.findAllByType(View).find(item => item.props.pointerEvents === "none");
	expect(StyleSheet.flatten(keyboardFill.props.style).backgroundColor).toBe(StyleSheet.flatten(notice.props.style).backgroundColor);
	await renderer.act(async () => screen.unmount());
	keyboardListener.mockRestore();
});

it("prefills and creates the standalone book calendar page", async () => {
	global.fetch = jest.fn(async () => ({ ok: true }));
	const { screen, navigation, submit } = await openCalendarEditor(null);
	expect(screen.root.findByType(HighlightingText).props.value).toBe('{{< bookcalendar view="list" >}}');
	expect(screen.root.findAllByType(Text).some(item => item.props.children === "Book calendar")).toBe(true);
	expect(screen.root.findAllByType(Text).some(item => item.props.children === "Share the book calendar on your blog.")).toBe(true);
	expect(submit().props.children.props.children).toBe("Add Page");
	await renderer.act(async () => submit().props.onPress());
	expect(global.fetch).toHaveBeenCalledTimes(1);
	const [url, options] = global.fetch.mock.calls[0];
	expect(url).toBe("https://micro.blog/micropub");
	expect(options.headers.Authorization).toBe("Bearer test-token");
	expect(options.body.get("h")).toBe("entry");
	expect(options.body.get("mp-channel")).toBe("pages");
	expect(options.body.get("name")).toBe("Book calendar");
	expect(options.body.get("content")).toBe('{{< bookcalendar view="list" >}}');
	expect(options.body.get("mp-destination")).toBe("https://example.com/");
	expect(navigation.goBack).toHaveBeenCalled();
	expect(epilogueStorage.set).not.toHaveBeenCalled();
	await renderer.act(async () => screen.unmount());
});

it("updates the existing page by URL with edited content", async () => {
	global.fetch = jest.fn(async () => ({ ok: true }));
	const page = { uid: 77, url: "https://example.com/my-reading/", title: "My Reading Calendar", content: 'Intro\n{{< bookcalendar view="list" >}}' };
	const { screen, navigation, submit } = await openCalendarEditor(page);
	expect(screen.root.findAllByType(Text).some(item => item.props.children === "My Reading Calendar")).toBe(true);
	expect(screen.root.findByType(HighlightingText).props.value).toBe(page.content);
	expect(submit().props.children.props.children).toBe("Update Page");
	screen.root.findByType(HighlightingText).instance.getText.mockResolvedValue('Edited intro\n{{< bookcalendar view="list" >}}');
	await renderer.act(async () => submit().props.onPress());
	const [url, options] = global.fetch.mock.calls[0];
	expect(url).toBe("https://micro.blog/micropub");
	expect(JSON.parse(options.body)).toEqual({
		action: "update", url: "https://example.com/my-reading/", "mp-channel": "pages",
		"mp-destination": "https://example.com/", replace: { content: 'Edited intro\n{{< bookcalendar view="list" >}}' }
	});
	expect(navigation.goBack).toHaveBeenCalled();
	expect(epilogueStorage.set).not.toHaveBeenCalled();
	await renderer.act(async () => screen.unmount());
});
