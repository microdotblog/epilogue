import React from "react";
import { Pressable, useColorScheme } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Icon } from "../Icon";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import { ConnectLibbyScreen, LibbyLibraryScreen } from "../screens/ConnectLibbyScreen";

const Stack = createNativeStackNavigator();

export function LibbyStack({ navigation }) {
	const styles = useEpilogueStyle();
	const tint = useColorScheme() === "dark" ? "#FFFFFF" : "#000000";
	const close = () => (
		<Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="close">
			<Icon name="close" color={tint} size={18} style={styles.navbarCloseIcon} />
		</Pressable>
	);

	return (
		<Stack.Navigator screenOptions={{ title: "Libby", headerTintColor: tint, headerBackButtonDisplayMode: "minimal" }}>
			<Stack.Screen name="LibbyLibrary" component={LibbyLibraryScreen} options={{ headerLeft: close }} />
			<Stack.Screen name="ConnectLibby" component={ConnectLibbyScreen} options={({ route }) => (
				route.params?.reconnect ? {} : { headerLeft: close }
			)} />
		</Stack.Navigator>
	);
}
