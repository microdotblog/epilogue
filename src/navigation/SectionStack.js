import React from "react";
import { useColorScheme } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { contentStackScreens } from "./ContentStackScreens";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import { HomeScreen } from "../screens/HomeScreen";
import { GoalsScreen } from "../screens/GoalsScreen";
import { MoviesScreen } from "../screens/MoviesScreen";
import { DiscoverScreen } from "../screens/DiscoverScreen";

const Stack = createNativeStackNavigator();
const sections = { Bookshelves: HomeScreen, Goals: GoalsScreen, Movies: MoviesScreen, Discover: DiscoverScreen };

export function SectionStack({ route }) {
	const styles = useEpilogueStyle();
	const dark = useColorScheme() === "dark";
	return (
		<Stack.Navigator screenOptions={{ headerTintColor: dark ? "#FFFFFF" : "#000000" }}>
			<Stack.Screen name={`${route.name}Root`} component={sections[route.name]}
				options={{ title: route.name === "Bookshelves" ? "" : route.name }} />
			{contentStackScreens(Stack, styles, dark)}
		</Stack.Navigator>
	);
}
