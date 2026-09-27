import React from "react";
import { DeviceEventEmitter, Image, Platform, Pressable } from "react-native";
import { SidebarVisibleContext } from "./navigation/SidebarContext";
import storage from "./Storage";
import { keys } from "./Constants";

export function refreshProfileAvatar() {
	DeviceEventEmitter.emit("epilogueProfileChanged");
}

export function useProfileAvatar(navigation) {
	const [avatar, setAvatar] = React.useState("https://micro.blog/images/blank_avatar.png");
	React.useEffect(() => {
		let active = true;
		const refresh = async () => {
			const username = await storage.get(keys.currentUsername);
			if (!active) return;
			setAvatar(username ? `https://micro.blog/${username}/avatar.jpg` : "https://micro.blog/images/blank_avatar.png");
		};
		refresh();
		const unsubscribe = navigation.addListener("focus", refresh);
		const subscription = DeviceEventEmitter.addListener("epilogueProfileChanged", refresh);
		return () => { active = false; unsubscribe(); subscription.remove(); };
	}, [navigation]);
	return avatar;
}

export function useProfileHeader(navigation, styles) {
	const sidebarVisible = React.useContext(SidebarVisibleContext);
	const avatar = useProfileAvatar(navigation);
	React.useEffect(() => {
		navigation.setOptions(sidebarVisible
			? { unstable_headerLeftItems: () => [], headerLeft: () => null }
			: profileHeaderOptions(avatar, () => navigation.navigate("Profile"), styles));
	}, [navigation, styles, sidebarVisible, avatar]);
}

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
