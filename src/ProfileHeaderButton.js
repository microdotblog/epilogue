import React from "react";
import { Image, Platform, Pressable } from "react-native";

export function profileHeaderOptions(avatarURL, onPress, styles) {
	const renderButton = (buttonStyle) => (
		<Pressable
			onPress={onPress}
			style={[styles.profileHeaderButton, buttonStyle]}
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
				element: renderButton(styles.profileHeaderButtonIOS),
				hidesSharedBackground: true
			}]
		};
	}

	return {
		headerLeft: renderButton
	};
}
