import React from "react";
import { Image, Platform, Pressable } from "react-native";

export function profileHeaderOptions(avatarURL, onPress, styles) {
	const renderButton = () => (
		<Pressable
			onPress={onPress}
			style={styles.profileHeaderButton}
			accessibilityRole="button"
			accessibilityLabel="show profile"
		>
			<Image style={styles.profileHeaderIcon} source={{ uri: avatarURL }} />
		</Pressable>
	);

	if (Platform.OS === "ios") {
		return {
			unstable_headerLeftItems: () => [{
				type: "custom",
				element: renderButton(),
				hidesSharedBackground: true
			}]
		};
	}

	return {
		headerLeft: renderButton
	};
}
