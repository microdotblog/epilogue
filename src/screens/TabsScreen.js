import React from "react";
import { Platform, useColorScheme, useWindowDimensions } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { SafeAreaView } from 'react-native-screens/experimental';
import { isWideTabletWindow, TabletLayout } from '../navigation/TabletLayout';
import { SectionStack } from '../navigation/SectionStack';

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
const tabletLayout = props => <TabletLayout {...props} />;

// Preserve the existing phone safe-area handling.
const tabScreenLayout = ({ children }) => (
	<SafeAreaView edges={{ left: true, right: true }}>
		{children}
	</SafeAreaView>
);

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

const lightTabActiveTintColor = "#C85F00";
const darkTabActiveTintColor = "#FFB45A";

const jsTabIcon = (routeName, activeTintColor) => ({ focused }) => (
	<Icon
		name={tabIcons[routeName].android}
		color={focused ? activeTintColor : "gray"}
		size={18}
	/>
);

export function TabsScreen({ navigation }) {
    const is_dark = (useColorScheme() == "dark");
	const { width, height } = useWindowDimensions();
	const isWideLandscape = isWideTabletWindow(width, height);
	const isTablet = useNativeTabs && Platform.isPad;
	const enable_open_library = false;
	const inactiveTintColor = "gray";
	const tabActiveTintColor = is_dark ? darkTabActiveTintColor : lightTabActiveTintColor;

	return (
		<Tab.Navigator
			layout={isTablet ? tabletLayout : undefined}
			screenLayout={useNativeTabs && !isTablet ? tabScreenLayout : undefined}
			screenOptions={({ route }) => ({
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				headerLeftContainerStyle: { paddingLeft: 15 },
				tabBarActiveTintColor: tabActiveTintColor,
				tabBarInactiveTintColor: inactiveTintColor,
				tabBarIcon: useNativeTabs
					? nativeTabIcon(route.name)
					: jsTabIcon(route.name, tabActiveTintColor),
				...(useNativeTabs ? {
					headerShown: !isTablet,
					lazy: false,
					tabBarControllerMode: Number.parseInt(Platform.Version, 10) >= 18
						? "tabBar"
						: undefined,
					tabBarStyle: isTablet && isWideLandscape ? { display: "none" } : undefined,
					tabBarMinimizeBehavior: "never",
				} : null),
			})}
		>
			<Tab.Screen name="Bookshelves" component={isTablet ? SectionStack : HomeScreen} options={{
				headerTitle: "",
				tabBarLabel: "Bookshelves",
			}} />
			<Tab.Screen name="Goals" component={isTablet ? SectionStack : GoalsScreen} options={{
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				tabBarLabel: "Goals",
			}} />
			<Tab.Screen name="Movies" component={isTablet ? SectionStack : MoviesScreen} options={{
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				tabBarLabel: "Movies",
			}} />
			<Tab.Screen name="Discover" component={isTablet ? SectionStack : DiscoverScreen} options={{
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
