import React, { useState } from "react";
import { Text, View, useColorScheme } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { keys } from "../Constants";
import { useEpilogueStyle } from '../hooks/useEpilogueStyle';
import { Icon } from '../Icon';
import epilogueStorage from "../Storage";
import { HomeScreen } from "./HomeScreen";
import { DiscoverScreen } from "./DiscoverScreen";
import { GoalsScreen } from "./GoalsScreen";
import { OpenLibraryScreen } from "./OpenLibraryScreen";

const Tab = createBottomTabNavigator();

export function TabsScreen({ navigation }) {
	const styles = useEpilogueStyle()
    const is_dark = (useColorScheme() == "dark");
	const enable_open_library = false;

	return (
		<Tab.Navigator>
			<Tab.Screen name="Bookshelves" component={HomeScreen} options={{				
				headerTitle: "",
				tabBarIcon: ({ focused, color, size }) => {
					if (focused) {
						return <Icon name="bookshelves" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} />
					}
					else {
						return <Icon name="bookshelves" color={"gray"} size={18} />
					}
				},
  				tabBarActiveTintColor: is_dark ? "#FFFFFF" : "#337AB7",
				tabBarInactiveTintColor: "gray"
			}} />
			<Tab.Screen name="Goals" component={GoalsScreen} options={{
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				tabBarIcon: ({ focused, color, size }) => {
					if (focused) {
						return <Icon name="goals" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} />
					}
					else {					
						return <Icon name="goals" color={"gray"} size={18} />
					}
				},
				tabBarActiveTintColor: is_dark ? "#FFFFFF" : "#337AB7",
				tabBarInactiveTintColor: "gray"
			}} />
			<Tab.Screen name="Discover" component={DiscoverScreen} options={{
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				tabBarIcon: ({ focused, color, size }) => {
					if (focused) {
						return <Icon name="discover" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} />
					}
					else {					
						return <Icon name="discover" color={"gray"} size={18} />
					}
				},
				tabBarActiveTintColor: is_dark ? "#FFFFFF" : "#337AB7",
				tabBarInactiveTintColor: "gray"
			}} />
			{ enable_open_library ? 
			<Tab.Screen name="Open Library" component={OpenLibraryScreen} options={{
				headerTintColor: is_dark ? "#FFFFFF" : "#000000",
				tabBarIcon: ({ focused, color, size }) => {
					if (focused) {
						return <Icon name="openlibrary" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} />
					}
					else {					
						return <Icon name="openlibrary" color={"gray"} size={18} />
					}
				},
				tabBarActiveTintColor: is_dark ? "#FFFFFF" : "#337AB7",
				tabBarInactiveTintColor: "gray"
			}} />
			: null }
		</Tab.Navigator>
	);
}
