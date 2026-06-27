import React from "react";
import { Platform, useColorScheme } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';

import { Icon } from '../Icon';
import { HomeScreen } from "./HomeScreen";
import { DiscoverScreen } from "./DiscoverScreen";
import { GoalsScreen } from "./GoalsScreen";
import { MoviesScreen } from "./MoviesScreen";
import { OpenLibraryScreen } from "./OpenLibraryScreen";

const useNativeTabs = Platform.OS === 'ios';
const Tab = useNativeTabs
	? createNativeBottomTabNavigator()
	: createBottomTabNavigator();

const tabIcons = {
	Bookshelves: {
		ios: "books.vertical",
		android: "bookshelves",
	},
	Goals: {
		ios: "calendar",
		android: "goals",
	},
	Movies: {
		ios: "movieclapper",
		android: "movies",
	},
	Discover: {
		ios: "magnifyingglass",
		android: "discover",
	},
	"Open Library": {
		ios: "building.columns",
		android: "openlibrary",
	},
};

const nativeTabIcon = (routeName) => () => ({
	type: "sfSymbol",
	name: tabIcons[routeName].ios,
});

const tabActiveTintColor = "#FF8800";

const jsTabIcon = (routeName, isDark) => ({ focused }) => (
	<Icon
		name={tabIcons[routeName].android}
		color={focused ? tabActiveTintColor : "gray"}
		size={18}
	/>
);

export function TabsScreen({ navigation }) {
    const is_dark = (useColorScheme() == "dark");
	const enable_open_library = false;
	const inactiveTintColor = "gray";

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				tabBarActiveTintColor: tabActiveTintColor,
				tabBarInactiveTintColor: inactiveTintColor,
				tabBarIcon: useNativeTabs
					? nativeTabIcon(route.name)
					: jsTabIcon(route.name, is_dark),
				...(useNativeTabs ? {
					headerShown: true,
					lazy: false,
					tabBarMinimizeBehavior: "never",
				} : null),
			})}
		>
			<Tab.Screen name="Bookshelves" component={HomeScreen} options={{				
				headerTitle: "",
				tabBarLabel: "Bookshelves",
			}} />
			<Tab.Screen name="Goals" component={GoalsScreen} options={{
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				tabBarLabel: "Goals",
			}} />
			<Tab.Screen name="Movies" component={MoviesScreen} options={{
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				tabBarLabel: "Movies",
			}} />
			<Tab.Screen name="Discover" component={DiscoverScreen} options={{
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				tabBarLabel: "Discover",
			}} />
			{ enable_open_library ? 
			<Tab.Screen name="Open Library" component={OpenLibraryScreen} options={{
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				tabBarLabel: "Open Library",
			}} />
			: null }
		</Tab.Navigator>
	);
}
