import React from "react";
import { View } from "react-native";

export function MovieDetailsScreen({ navigation, route }) {
	React.useEffect(() => {
		const title = route.params?.movie?.title || "Movie";
		navigation.setOptions({ title: title });
	}, [navigation, route]);

	return (
		<View />
	)
}
