import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { dark, light } from "../Styles";

export const useEpilogueTheme = () => {
	const colorScheme = useColorScheme();
	const [theme, setTheme] = useState(colorScheme === "light" ? light : dark);

	useEffect(() => {
		setTheme(colorScheme === "light" ? light : dark)
	}, [colorScheme]);

	return theme;
}
