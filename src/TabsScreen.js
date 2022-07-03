import React, { useState } from "react";
import { Text, View } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";
import { HomeScreen } from "./HomeScreen";
import { DiscoverScreen } from "./DiscoverScreen";

const Tab = createBottomTabNavigator();

export function TabsScreen({ navigation }) {
	const styles = useEpilogueStyle()

	return (
		<Tab.Navigator>
			<Tab.Screen name="Bookshelves" component={HomeScreen} options={{
				headerTitle: ""
			}} />
			<Tab.Screen name="Discover" component={DiscoverScreen} options={{
			}} />
		</Tab.Navigator>
	);
}
