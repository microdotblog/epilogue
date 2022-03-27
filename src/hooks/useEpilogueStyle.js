import { useEffect, useState } from "react";
import { useColorScheme, StyleSheet } from "react-native";
import { light, dark } from "../Styles";

// Get all keys for both light and dark keys
const allStyleKeys = new Set(Object.keys(light).concat(Object.keys(dark)));

// Merge dark styles over light styles
const darkMergedOnLight = StyleSheet.create(Array.from(allStyleKeys).reduce((prev, key) => {
	if (light[key] && dark[key]) {
		prev[key] = StyleSheet.compose(light[key], dark[key]);
	} else if (light[key]) {
		prev[key] = light[key]
	} else {
		prev[key] = dark[key]
	}
	return prev;
}, {}));

// Expose the correct stylesheet depending on the selected colour scheme
export const useEpilogueStyle = () => {
	const colorScheme = useColorScheme();
	const [theme, setTheme] = useState(colorScheme === "light" ? light : darkMergedOnLight);

	useEffect(() => {
		setTheme(colorScheme === "light" ? light : darkMergedOnLight)
	}, [colorScheme, light, darkMergedOnLight]);

	return theme;
}
