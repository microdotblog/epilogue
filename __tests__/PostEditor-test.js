import React from "react";
import renderer from "react-test-renderer";
import { InputAccessoryView, Platform, Text } from "react-native";
import { PostScreen } from "../src/screens/PostScreen";
import HighlightingText from "../src/components/text/highlighting_text";
import epilogueStorage from "../src/Storage";
import { keys } from "../src/Constants";

jest.mock("@react-navigation/elements", () => ({ useHeaderHeight: () => 60 }));
jest.mock("../src/Storage", () => ({ get: jest.fn(), set: jest.fn() }));

const originalOS = Platform.OS;
const originalFetch = global.fetch;
let values;
beforeEach(() => {
  Platform.OS = "ios";
  values = {
    [keys.currentText]: "existing **draft**",
    [keys.currentTitle]: "",
    [keys.currentBlogName]: "example.com",
    [keys.currentBlogID]: "https://example.com/",
    [keys.blogCount]: 2,
    [keys.authToken]: "test-token",
    [keys.micropubURL]: "https://micro.blog/micropub"
  };
  epilogueStorage.get.mockImplementation(async key => values[key]);
  epilogueStorage.set.mockImplementation(async (key, value) => { values[key] = value; });
  global.fetch = jest.fn(async () => ({ ok: true }));
});
afterEach(() => { Platform.OS = originalOS; global.fetch = originalFetch; jest.clearAllMocks(); });

async function openPost() {
  const events = {};
  const navigation = {
    addListener: jest.fn((event, callback) => { events[event] = callback; return jest.fn(); }),
    isFocused: jest.fn(() => true), setOptions: jest.fn(), goBack: jest.fn(), navigate: jest.fn()
  };
  let screen;
  await renderer.act(async () => {
    screen = renderer.create(<PostScreen navigation={navigation} route={{ params: { books: [] } }} />);
  });
  const editor = () => screen.root.findByType(HighlightingText);
  return { screen, navigation, events, editor, submit: () => navigation.setOptions.mock.calls.at(-1)[0].headerRight() };
}

it("hydrates the draft before mounting the editor and does not reset text on return from Blogs", async () => {
  const { screen, navigation, events, editor } = await openPost();
  expect(editor().props.value).toBe("existing **draft**");
  await renderer.act(async () => editor().props.onChangeText("new **text**"));
  values[keys.currentText] = "stale saved draft";
  values[keys.currentBlogName] = "different.example.com";
  navigation.isFocused.mockReturnValue(false);
  await renderer.act(async () => events.blur());
  expect(editor().props.editable).toBe(false);
  navigation.isFocused.mockReturnValue(true);
  await renderer.act(async () => events.focus());
  expect(editor().props.value).toBe("new **text**");
  expect(editor().props.editable).toBe(true);
  expect(epilogueStorage.get.mock.calls.filter(([key]) => key === keys.currentText)).toHaveLength(1);
  expect(screen.root.findAllByType(Text).some(item => item.props.children === "different.example.com")).toBe(true);
  const focus = jest.spyOn(editor().instance, "focus");
  await renderer.act(async () => events.transitionEnd({ data: { closing: false } }));
  expect(focus).toHaveBeenCalledWith();
  await renderer.act(async () => screen.unmount());
});

it("submits the newest WebView text and preserves reading-goals extra content", async () => {
  values[keys.currentTitle] = "My reading goals";
  values[keys.currentTextExtra] = '\n{{< bookgoals >}}';
  const { screen, editor, submit } = await openPost();
  jest.spyOn(editor().instance, "getText").mockResolvedValue("**Last keystroke**");
  expect(screen.root.findAllByType(InputAccessoryView)).toHaveLength(0);
  expect(screen.root.findAllByType(Text).some(item => typeof item.props.children === "string" && item.props.children.includes("Book reading goals"))).toBe(true);
  await renderer.act(async () => submit().props.onPress());
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [, options] = global.fetch.mock.calls[0];
  expect(options.body.get("content")).toBe('**Last keystroke**\n{{< bookgoals >}}');
  expect(options.body.get("name")).toBe("My reading goals");
  expect(options.headers.Authorization).toBe("Bearer test-token");
  await renderer.act(async () => screen.unmount());
});
