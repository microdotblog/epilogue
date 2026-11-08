import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from "react-native";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import { WebView } from "react-native-webview";
import { useEpilogueStyle } from "./hooks/useEpilogueStyle";
import { extractPostContent, postPreviewDocument, webURL } from "./utils/postPreviewHTML";

const avatarPlaceholder = "https://micro.blog/images/blank_avatar.png";

export function PostPreview({ post }) {
	const detailStyles = useEpilogueStyle();
	const dark = useColorScheme() === "dark";
	const { fontScale } = useWindowDimensions();
	const url = webURL(post.url);
	const hostname = url ? new URL(url).hostname : "";
	const [preview, setPreview] = useState(undefined);
	const [height, setHeight] = useState(44);
	const backgroundColor = dark ? "#212936" : "#FFFFFF";
	const color = dark ? "#E5E7EB" : "#444444";

	useEffect(() => {
		if (!url) return;
		const controller = new AbortController();
		let mounted = true;
		const timeout = setTimeout(() => controller.abort(), 12000);
		async function loadPost() {
			try {
				const response = await fetch(url, {
					credentials: "omit",
					signal: controller.signal,
					headers: { Accept: "text/html, application/xhtml+xml" }
				});
				if (!response.ok) throw new Error("Could not download post");
				const html = await response.text();
				if (mounted) {
					const content = controller.signal.aborted ? "" : extractPostContent(html);
					setPreview(content || null);
				}
			} catch {
				if (mounted) setPreview(null);
			} finally {
				clearTimeout(timeout);
			}
		}
		loadPost();
		return () => {
			mounted = false;
			clearTimeout(timeout);
			controller.abort();
		};
	}, [url]);

	const source = useMemo(() => preview && {
		html: postPreviewDocument(preview, { dark, fontSize: 16 * fontScale })
	}, [preview, dark, fontScale]);

	async function openPost() {
		try {
			if (await InAppBrowser.isAvailable()) {
				await InAppBrowser.open(url, { animated: true });
			} else {
				await Linking.openURL(url);
			}
		} catch {
			Alert.alert("Couldn’t open link");
		}
	}

	function onMessage(event) {
		let message;
		try { message = JSON.parse(event.nativeEvent.data); }
		catch { return; }
		if (Number.isFinite(message?.height) && message.height > 0) {
			setHeight(message.height);
		}
	}

	if (!url) return null;
	return (
		<View style={[styles.pane, { backgroundColor }]}>
			<View style={styles.row}>
				<Image style={styles.avatar} source={{ uri: webURL(post.avatar) || avatarPlaceholder }}
					accessible={Boolean(post.author)} accessibilityLabel={post.author} />
				<View style={styles.body}>
					{preview === undefined ? (
						<ActivityIndicator size="small" style={styles.spinner} accessibilityLabel="Loading blog post" />
					) : source ? (
						<WebView
							source={source}
							originWhitelist={["*"]}
							onShouldStartLoadWithRequest={({ url: nextURL }) => nextURL === "about:blank"}
							onMessage={onMessage}
							onError={() => setPreview(null)}
							allowFileAccess={false}
							domStorageEnabled={false}
							thirdPartyCookiesEnabled={false}
							setSupportMultipleWindows={false}
							allowsLinkPreview={false}
							dataDetectorTypes="none"
							scrollEnabled={false}
							automaticallyAdjustContentInsets={false}
							textZoom={100}
							containerStyle={{ flex: 0, height, backgroundColor }}
							style={{ backgroundColor }}
						/>
					) : (
						<Text style={[styles.unavailable, { color }]}>Couldn’t preview this post.</Text>
					)}
				</View>
			</View>
			<Pressable accessibilityRole="link" onPress={openPost} style={({ pressed }) => [
				detailStyles.bookDetailsBookshelves,
				detailStyles.bookDetailsButton,
				styles.openButton,
				pressed && detailStyles.bookDetailsButtonPressed
			]}>
				<Text style={[detailStyles.bookDetailsBookshelfTitle, styles.openTitle]}>Open {hostname || "original post"}</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	pane: { paddingVertical: 20, gap: 16 },
	row: { paddingHorizontal: 20, flexDirection: "row", gap: 16, alignItems: "flex-start" },
	avatar: { width: 48, height: 48, borderRadius: 24 },
	body: { flex: 1, minWidth: 0, minHeight: 48, justifyContent: "center" },
	spinner: { alignSelf: "flex-start" },
	unavailable: { fontSize: 16 },
	openButton: { alignSelf: "center", paddingVertical: 10 },
	openTitle: { flex: 0, flexShrink: 1, textAlign: "center" }
});
