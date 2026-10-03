import React from "react";
import renderer from "react-test-renderer";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import HighlightingText from "../src/components/text/highlighting_text";

const originalOS = Platform.OS;
afterEach(() => { Platform.OS = originalOS; jest.useRealTimers(); });

async function openEditor(props = {}) {
  let screen;
  await renderer.act(async () => {
    screen = renderer.create(<HighlightingText value="draft" style={{ flex: 1, padding: 14, fontSize: 17, lineHeight: 24 }} {...props} />);
  });
  const editor = screen.root.findByType(HighlightingText).instance;
  const webview = screen.root.findByType(WebView);
  function message(type, payload) {
    return renderer.act(() => webview.props.onMessage({ nativeEvent: { data: JSON.stringify({ type, payload }) } }));
  }
  await message("ready");
  const lastConfig = () => JSON.parse(webview.instance.injectJavaScript.mock.calls.at(-1)[0].match(/updateFromReact\((.*)\)/)[1]);
  return { screen, editor, webview, message, lastConfig };
}

it("does not rewrite the document or selection when React echoes typing", async () => {
  const onChangeText = jest.fn();
  const { screen, webview, message } = await openEditor({ onChangeText });
  const source = webview.props.source;
  webview.instance.injectJavaScript.mockClear();
  await message("change", { text: "**typed**", selection: { start: 5, end: 5 } });
  await renderer.act(async () => screen.update(<HighlightingText value="**typed**" style={{ flex: 1, padding: 14, fontSize: 17, lineHeight: 24 }} onChangeText={onChangeText} />));
  expect(onChangeText).toHaveBeenCalledWith("**typed**");
  expect(webview.instance.injectJavaScript).not.toHaveBeenCalled();
  expect(webview.props.source).toBe(source);
  await renderer.act(async () => screen.unmount());
});

it("uses the local flex height and keeps the caret visible when the keyboard resizes it", async () => {
  const { screen, message, lastConfig } = await openEditor();
  await message("focus");
  const container = screen.root.findAllByType(View).find(item => item.props.onLayout);
  await renderer.act(async () => container.props.onLayout({ nativeEvent: { layout: { height: 240 } } }));
  expect(lastConfig()).toMatchObject({ viewportHeight: 240, scrollSelectionIntoView: true });
  expect(StyleSheet.flatten(container.props.style)).toMatchObject({ flex: 1, padding: 0 });
  expect(StyleSheet.flatten(container.props.style).height).toBeUndefined();
  await message("blur");
  await renderer.act(async () => container.props.onLayout({ nativeEvent: { layout: { height: 500 } } }));
  expect(lastConfig().scrollSelectionIntoView).toBe(false);
  await renderer.act(async () => screen.unmount());
});

it("reads the current WebView text before submitting, even without a typing notification", async () => {
  const { screen, editor, webview, message } = await openEditor();
  const text = editor.getText();
  expect(webview.instance.injectJavaScript.mock.calls.at(-1)[0]).toContain("getMarkdown()");
  await message("snapshot", { requestID: 1, text: "last keystroke" });
  await expect(text).resolves.toBe("last keystroke");
  await renderer.act(async () => screen.unmount());
});

it("reports an unavailable editor instead of silently submitting stale text", async () => {
  jest.useFakeTimers();
  const { screen, editor } = await openEditor();
  const text = editor.getText();
  const rejected = expect(text).rejects.toThrow("Could not read editor text");
  jest.advanceTimersByTime(2000);
  await rejected;
  await renderer.act(async () => screen.unmount());
});

it("updates theme and Dynamic Type without reloading or moving the cursor", async () => {
  const { screen, webview, lastConfig } = await openEditor();
  const source = webview.props.source;
  await renderer.act(async () => screen.update(<HighlightingText value="draft" colorScheme="dark" fontScale={2} style={{ flex: 1, fontSize: 17, lineHeight: 24 }} />));
  expect(lastConfig()).toMatchObject({ fontSize: 34, lineHeight: 48, colorScheme: "dark", focus: false });
  expect(lastConfig()).not.toHaveProperty("value");
  expect(webview.props.source).toBe(source);
  await renderer.act(async () => screen.unmount());
});

it("restores Android focus after returning without moving the caret to the end", async () => {
  Platform.OS = "android";
  const { screen, webview, lastConfig } = await openEditor({ autoFocus: false, editable: false });
  await renderer.act(async () => screen.update(<HighlightingText value="draft" autoFocus={true} editable={true} />));
  expect(webview.instance.requestFocus).toHaveBeenCalled();
  expect(lastConfig()).toMatchObject({ focus: true, scrollSelectionIntoView: true });
  expect(lastConfig().cursorToEnd).not.toBe(true);
  expect(lastConfig()).not.toHaveProperty("value");
  await renderer.act(async () => screen.unmount());
});

it("prevents links or pasted HTML from navigating the editor to a remote page", async () => {
  const { screen, webview } = await openEditor();
  expect(webview.props.onShouldStartLoadWithRequest({ url: "about:blank" })).toBe(true);
  expect(webview.props.onShouldStartLoadWithRequest({ url: "https://micro.blog/remote" })).toBe(false);
  expect(webview.props.onShouldStartLoadWithRequest({ url: "https://micro.blog.evil.example" })).toBe(false);
  await renderer.act(async () => screen.unmount());
});

it("honors an explicit initial selection and a subsequent selection from native controls", async () => {
  const { screen, webview, lastConfig } = await openEditor({ autoFocus: true, selection: { start: 1, end: 3 } });
  expect(lastConfig()).toMatchObject({ selection: { start: 1, end: 3 }, cursorToEnd: false });
  webview.instance.injectJavaScript.mockClear();
  await renderer.act(async () => screen.update(<HighlightingText value="draft" autoFocus={true} selection={{ start: 2, end: 4 }} />));
  expect(lastConfig()).toMatchObject({ selection: { start: 2, end: 4 }, focus: true });
  expect(lastConfig()).not.toHaveProperty("value");
  await renderer.act(async () => screen.unmount());
});
