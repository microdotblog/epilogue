import React from "react";
import { Dimensions, Platform } from "react-native";
import renderer from "react-test-renderer";

import { TabsScreen } from "../src/screens/TabsScreen";
import { SectionStack } from "../src/navigation/SectionStack";

jest.mock("@react-navigation/bottom-tabs", () => ({
	createBottomTabNavigator: () => ({ Navigator: "JSTabNavigator", Screen: "TabScreen" })
}));
jest.mock("@react-navigation/bottom-tabs/unstable", () => ({
	createNativeBottomTabNavigator: () => ({ Navigator: "NativeTabNavigator", Screen: "TabScreen" })
}));
jest.mock("../src/screens/HomeScreen", () => ({ HomeScreen: () => null }));
jest.mock("../src/screens/GoalsScreen", () => ({ GoalsScreen: () => null }));
jest.mock("../src/screens/MoviesScreen", () => ({ MoviesScreen: () => null }));
jest.mock("../src/screens/DiscoverScreen", () => ({ DiscoverScreen: () => null }));
jest.mock("../src/screens/OpenLibraryScreen", () => ({ OpenLibraryScreen: () => null }));

const originalWindow = Dimensions.get("window");
let screen;

beforeEach(() => {
	jest.spyOn(Platform, "Version", "get").mockReturnValue("26.0");
	jest.spyOn(Platform, "isPad", "get").mockReturnValue(true);
});

afterEach(async () => {
	await renderer.act(async () => {
		screen?.unmount();
	});
	Dimensions.set({ window: originalWindow });
	jest.restoreAllMocks();
});

function resize(width, height) {
	Dimensions.set({ window: { width, height, scale: 2, fontScale: 1 } });
}

function mode() {
	return screen.root.findByType("NativeTabNavigator").props.screenOptions({
		route: { name: "Bookshelves" }
}).tabBarStyle?.display;
}

it.each([
	[1194, 834, "none"],
	[768, 600, "none"],
	[834, 1194, undefined],
	[700, 600, undefined],
	[600, 834, undefined],
	[834, 834, undefined],
	[402, 874, undefined]
])("uses the expected presentation at %i x %i", async (width, height, expected) => {
	resize(width, height);
	await renderer.act(async () => {
		screen = renderer.create(<TabsScreen />);
	});
	expect(mode()).toBe(expected);
	expect(screen.root.findAllByType("TabScreen").every(tab => tab.props.component === SectionStack)).toBe(true);
	expect(screen.root.findAllByType("TabScreen").map(tab => tab.props.name)).toEqual([
		"Bookshelves", "Goals", "Movies", "Discover"
	]);
});

it("updates the existing navigator when the window rotates or resizes", async () => {
	resize(1194, 834);
	await renderer.act(async () => {
		screen = renderer.create(<TabsScreen />);
	});
	const navigator = screen.root.findByType("NativeTabNavigator");
	expect(mode()).toBe("none");

	for (const [width, height, expected] of [
		[834, 1194, undefined],
		[1194, 834, "none"],
		[600, 500, undefined]
	]) {
		await renderer.act(async () => resize(width, height));
		expect(mode()).toBe(expected);
		expect(screen.root.findByType("NativeTabNavigator")).toBe(navigator);
	}
});

it("keeps the existing screens and tab presentation on iPhone", async () => {
	jest.spyOn(Platform, "isPad", "get").mockReturnValue(false);
	resize(1194, 834);
	await renderer.act(async () => {
		screen = renderer.create(<TabsScreen />);
	});
	expect(mode()).toBeUndefined();
	expect(screen.root.findByType("NativeTabNavigator").props.layout).toBeUndefined();
	expect(screen.root.findAllByType("TabScreen").every(tab => tab.props.component !== SectionStack)).toBe(true);
});
