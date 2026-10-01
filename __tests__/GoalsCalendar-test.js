import React from "react";
import renderer from "react-test-renderer";
import { FlatList, Platform } from "react-native";
import { GoalsScreen } from "../src/screens/GoalsScreen";

jest.mock("@react-navigation/native", () => ({ useScrollToTop: jest.fn() }));
jest.mock("../src/ProfileHeaderButton", () => ({ useProfileHeader: jest.fn() }));
jest.mock("../src/screens/CalendarScreen", () => ({
	CalendarScreen: props => require("react").createElement("CalendarView", props)
}));

const originalOS = Platform.OS;
afterEach(() => { Platform.OS = originalOS; });

it.each(["ios", "android"])("switches the Goals title segments without navigating on %s", async os => {
	Platform.OS = os;
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
	expect(navigation.navigate).not.toHaveBeenCalled();
	await renderer.act(async () => segments()[0].props.onPress());
	expect(screen.root.findAllByType("CalendarView")).toHaveLength(1);
	expect(screen.root.findAllByType(FlatList)).toHaveLength(1);
	await renderer.act(async () => screen.unmount());
});
