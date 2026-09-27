import React from "react";
import { Dimensions, Text } from "react-native";
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
});

function resize(width, height) {
	Dimensions.set({ window: { width, height, scale: 2, fontScale: 1 } });
}

it("shows individual shelves and selects them from another section", async () => {
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
