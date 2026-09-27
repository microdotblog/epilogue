import React from "react";
import renderer from "react-test-renderer";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SectionStack } from "../src/navigation/SectionStack";

jest.mock("../src/screens/HomeScreen", () => ({
	HomeScreen: props => require("react").createElement("BooksRoot", props)
}));
jest.mock("../src/screens/GoalsScreen", () => ({
	GoalsScreen: props => require("react").createElement("GoalsRoot", props)
}));
jest.mock("../src/screens/BookDetailsScreen", () => ({
	BookDetailsScreen: props => require("react").createElement("BookDetail", props)
}));
jest.mock("../src/screens/EditBookInfoScreen", () => ({
	EditBookInfoScreen: props => require("react").createElement("BookEditor", props)
}));

const Tab = createBottomTabNavigator();
const Root = createNativeStackNavigator();
const Profile = () => null;
function Tabs() {
	return <Tab.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
		<Tab.Screen name="Bookshelves" component={SectionStack} />
		<Tab.Screen name="Goals" component={SectionStack} />
	</Tab.Navigator>;
}

it("keeps details and editing in their section while presenting profile at the root", async () => {
	const navigation = createNavigationContainerRef();
	let screen;
	await renderer.act(async () => {
		screen = renderer.create(
			<NavigationContainer ref={navigation}>
				<Root.Navigator screenOptions={{ animation: "none" }}>
					<Root.Screen name="Tabs" component={Tabs} />
					<Root.Screen name="Profile" component={Profile} />
				</Root.Navigator>
			</NavigationContainer>
		);
	});
	const section = name => navigation.getRootState().routes[0].state.routes.find(route => route.name === name).state;
	const books = screen.root.findByType("BooksRoot").props.navigation;
	await renderer.act(async () => books.navigate("Details", { isbn: "123", title: "Original" }));
	const detailKey = section("Bookshelves").routes[1].key;
	expect(navigation.getRootState().routes).toHaveLength(1);

	const detail = screen.root.findByType("BookDetail").props.navigation;
	await renderer.act(async () => detail.navigate("EditBookInfo", { isbn: "123" }));
	expect(section("Bookshelves").routes.map(route => route.name)).toEqual(["BookshelvesRoot", "Details", "EditBookInfo"]);
	await renderer.act(async () => screen.root.findByType("BookEditor").props.navigation.popTo("Details", { title: "Updated" }, { merge: true }));
	expect(section("Bookshelves").routes[1]).toMatchObject({ key: detailKey, params: { isbn: "123", title: "Updated" } });
	expect(section("Bookshelves").routes).toHaveLength(2);

	await renderer.act(async () => detail.navigate("Goals"));
	await renderer.act(async () => screen.root.findByType("GoalsRoot").props.navigation.navigate("Details", { isbn: "456" }));
	expect(section("Goals").routes[1].params.isbn).toBe("456");
	expect(section("Bookshelves").routes[1].key).toBe(detailKey);
	await renderer.act(async () => books.navigate("Bookshelves"));
	expect(navigation.getCurrentRoute().key).toBe(detailKey);

	await renderer.act(async () => detail.navigate("Profile"));
	expect(navigation.getRootState().routes.map(route => route.name)).toEqual(["Tabs", "Profile"]);
	await renderer.act(async () => navigation.goBack());
	expect(navigation.getCurrentRoute().key).toBe(detailKey);
	await renderer.act(async () => screen.unmount());
});
