import React from "react";
import { AccessibilityInfo, Animated, Dimensions, Text } from "react-native";
import renderer from "react-test-renderer";
import { TabletLayout } from "../src/navigation/TabletLayout";
import { SidebarBookshelvesContext, SidebarVisibleContext } from "../src/navigation/SidebarContext";

jest.mock("react-native-screens/experimental", () => ({
	Split: { Host: "SplitHost", Column: "SplitColumn" },
	SafeAreaView: "SplitSafeArea"
}));
jest.mock("react-native-screens", () => ({
	ScreenStack: "NativeStack",
	ScreenStackItem: "NativeStackItem",
	ScreenStackHeaderLeftView: "HeaderLeft"
}));

const originalWindow = Dimensions.get("window");
let screen;
const state = { index: 2, routes: ["Bookshelves", "Goals", "Movies", "Discover"].map(name => ({ key: name, name })) };
const navigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) };
const content = <Text testID="content">Content</Text>;

afterEach(async () => {
	await renderer.act(async () => screen?.unmount());
	Dimensions.set({ window: originalWindow });
	jest.clearAllMocks();
	jest.restoreAllMocks();
});

function resize(width, height) {
	Dimensions.set({ window: { width, height, scale: 2, fontScale: 1 } });
}

it("shows individual shelves and selects them from another section", async () => {
	const animate = jest.spyOn(Animated, "timing");
	const accessibilityListener = jest.spyOn(AccessibilityInfo, "addEventListener");
	resize(1133, 744);
	const shelves = [{ id: "A", title: "Currently reading" }, { id: "B", title: "Want to read" }];
	const onSelect = jest.fn();
	function Content() {
		const publish = React.useContext(SidebarBookshelvesContext);
		React.useEffect(() => {
			publish({ bookshelves: shelves, selectedBookshelfID: "B", onSelect });
		}, [publish]);
		return content;
	}
	const render = index => <TabletLayout state={{ ...state, index }} navigation={navigation}><Content /></TabletLayout>;
	await renderer.act(async () => { screen = renderer.create(render(2)); });
	expect(screen.root.findAllByProps({ testID: "sidebar-Bookshelves" })).toHaveLength(0);
	expect(screen.root.findByProps({ testID: "sidebar-shelf-B" }).props.accessibilityState.selected).toBe(false);
	screen.root.findByProps({ testID: "sidebar-shelf-B" }).props.onPress();
	expect(onSelect).toHaveBeenCalledWith(shelves[1]);
	expect(navigation.navigate).toHaveBeenCalledWith("Bookshelves");
	await renderer.act(async () => screen.update(render(0)));
	expect(screen.root.findByProps({ testID: "sidebar-shelf-A" }).props.accessibilityState.selected).toBe(false);
	expect(screen.root.findByProps({ testID: "sidebar-shelf-B" }).props.accessibilityState.selected).toBe(true);

	const disclosure = () => screen.root.findByProps({ testID: "sidebar-bookshelves-disclosure" });
	const shelfContainer = () => screen.root.findByProps({ testID: "sidebar-shelf-container" });
	await renderer.act(async () => screen.root.findByProps({ testID: "sidebar-shelf-content" }).props.onLayout({ nativeEvent: { layout: { height: 104 } } }));
	expect(shelfContainer().props.style.height.__getValue()).toBe(104);
	expect(disclosure().props.accessibilityState.expanded).toBe(true);
	onSelect.mockClear();
	navigation.navigate.mockClear();
	await renderer.act(async () => disclosure().props.onPress());
	expect(animate).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ toValue: 0, duration: 200, useNativeDriver: false }));
	const progress = animate.mock.calls.at(-1)[0];
	await renderer.act(async () => { progress.stopAnimation(); progress.setValue(0.5); });
	expect(shelfContainer().props.style.height.__getValue()).toBe(52);
	await renderer.act(async () => progress.setValue(0));
	// Content measures at its natural height even when the outer container is closed.
	expect(screen.root.findByProps({ testID: "sidebar-shelf-content" }).props.style).toEqual({ position: "absolute", top: 0, left: 0, right: 0 });
	await renderer.act(async () => screen.root.findByProps({ testID: "sidebar-shelf-content" }).props.onLayout({ nativeEvent: { layout: { height: 156 } } }));
	expect(shelfContainer().props.style.height.__getValue()).toBe(0);
	expect(disclosure().props.accessibilityState.expanded).toBe(false);
	expect(screen.root.findByProps({ testID: "sidebar-shelf-B" })).toBeDefined();
	expect(shelfContainer().props.accessibilityElementsHidden).toBe(true);
	expect(shelfContainer().props.pointerEvents).toBe("none");
	expect(screen.root.findByProps({ testID: "sidebar-Goals" })).toBeDefined();
	expect(onSelect).not.toHaveBeenCalled();
	expect(navigation.navigate).not.toHaveBeenCalled();
	await renderer.act(async () => resize(744, 1133));
	await renderer.act(async () => resize(1133, 744));
	expect(disclosure().props.accessibilityState.expanded).toBe(false);
	await renderer.act(async () => disclosure().props.onPress());
	expect(animate).toHaveBeenLastCalledWith(progress, expect.objectContaining({ toValue: 1, duration: 200, useNativeDriver: false }));
	await renderer.act(async () => { progress.stopAnimation(); progress.setValue(1); });
	expect(shelfContainer().props.style.height.__getValue()).toBe(156);
	expect(disclosure().props.accessibilityState.expanded).toBe(true);
	expect(screen.root.findByProps({ testID: "sidebar-shelf-B" }).props.accessibilityState.selected).toBe(true);
	const motionChanged = accessibilityListener.mock.calls.find(([event]) => event === "reduceMotionChanged")[1];
	motionChanged(true);
	animate.mockClear();
	await renderer.act(async () => disclosure().props.onPress());
	expect(disclosure().props.accessibilityState.expanded).toBe(false);
	expect(animate).not.toHaveBeenCalled();
	expect(shelfContainer().props.style.height.__getValue()).toBe(0);
});

it("tiles two columns with a profile toolbar and no sidebar toggle", async () => {
	resize(1133, 744);
	await renderer.act(async () => {
		screen = renderer.create(<TabletLayout state={state} navigation={navigation}>{content}</TabletLayout>);
	});
	const host = screen.root.findByType("SplitHost");
	expect(host.props.preferredSplitBehavior).toBe("tile");
	expect(host.props.preferredDisplayMode).toBe("oneBesideSecondary");
	expect(host.props.displayModeButtonVisibility).toBe("never");
	expect(host.props.presentsWithGesture).toBe(false);
	expect(screen.root.findAllByType("SplitColumn")).toHaveLength(2);
	expect(screen.root.findByProps({ testID: "sidebar-Movies" }).props.accessibilityState.selected).toBe(true);
	screen.root.findByProps({ testID: "sidebar-Discover" }).props.onPress();
	expect(navigation.navigate).toHaveBeenCalledWith("Discover");
	const header = screen.root.findByType("NativeStackItem").props.headerConfig;
	header.children.props.children.props.onPress();
	expect(navigation.navigate).toHaveBeenCalledWith("Profile");
});

it("keeps content mounted while resizing and follows native collapse events", async () => {
	const visibility = [];
	function Content() {
		visibility.push(React.useContext(SidebarVisibleContext));
		return content;
	}
	resize(1133, 744);
	await renderer.act(async () => {
		screen = renderer.create(<TabletLayout state={state} navigation={navigation}><Content /></TabletLayout>);
	});
	const mountedContent = screen.root.findByType(Content);
	await renderer.act(async () => resize(744, 1133));
	expect(screen.root.findByType("SplitHost").props.preferredDisplayMode).toBe("secondaryOnly");
	expect(visibility.at(-1)).toBe(false);
	await renderer.act(async () => resize(1133, 744));
	expect(visibility.at(-1)).toBe(true);
	await renderer.act(async () => screen.root.findByType("SplitHost").props.onCollapse());
	expect(visibility.at(-1)).toBe(false);
	await renderer.act(async () => screen.root.findByType("SplitHost").props.onExpand());
	expect(visibility.at(-1)).toBe(true);
	expect(screen.root.findByType(Content)).toBe(mountedContent);
});
