import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Alert, Animated, Image, Linking, Pressable, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from "react-native";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import { WebView } from "react-native-webview";
import { useEpilogueStyle } from "./hooks/useEpilogueStyle";
import { extractPostContent, postPreviewDocument, webURL } from "./utils/postPreviewHTML";

const avatarPlaceholder = "https://micro.blog/images/blank_avatar.png";
const panePadding = 20;
const spinnerHeight = 48;

export function PostPreview({ post }) {
	const detailStyles = useEpilogueStyle();
	const dark = useColorScheme() === "dark";
	const { fontScale } = useWindowDimensions();
	const url = webURL(post.url);
	const hostname = url ? new URL(url).hostname : "";
	const [preview, setPreview] = useState(undefined);
	const [webViewHeight, setWebViewHeight] = useState(null);
	const [paneHeight] = useState(() => new Animated.Value(spinnerHeight + panePadding * 2));
	const reduceMotion = useRef(false);
	const loading = preview === undefined || (preview !== null && webViewHeight === null);
	const backgroundColor = dark ? "#212936" : "#FFFFFF";
	const color = dark ? "#E5E7EB" : "#444444";

	useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled().then(enabled => { reduceMotion.current = enabled; });
		const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", enabled => {
			reduceMotion.current = enabled;
		});
		return () => {
			subscription.remove();
			paneHeight.stopAnimation();
		};
	}, [paneHeight]);

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
		if (Number.isFinite(message?.height) && message.height >= 0) {
			setWebViewHeight(Math.max(1, message.height));
		}
	}

	function onContentLayout(event) {
		if (loading) return;
		const { height } = event.nativeEvent.layout;
		if (reduceMotion.current) {
			paneHeight.setValue(height);
		} else {
			Animated.timing(paneHeight, {
				toValue: height,
				duration: 200,
				useNativeDriver: false
			}).start();
		}
	}

	if (!url) return null;
	return (
		<Animated.View style={[styles.pane, { height: paneHeight, backgroundColor }]}>
			{loading && (
				<ActivityIndicator size="small" style={styles.spinner} accessibilityLabel="Loading blog post" />
			)}
			<View
				style={[styles.content, loading && styles.hiddenContent]}
				onLayout={onContentLayout}
				pointerEvents={loading ? "none" : "auto"}
				accessibilityElementsHidden={loading}
				importantForAccessibility={loading ? "no-hide-descendants" : "auto"}
			>
				<View style={styles.row}>
					<Image style={styles.avatar} source={{ uri: webURL(post.avatar) || avatarPlaceholder }}
						accessible={Boolean(post.author)} accessibilityLabel={post.author} />
					<View style={styles.body}>
						{source ? (
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
								containerStyle={{ flex: 0, height: webViewHeight ?? 44, backgroundColor }}
								style={{ backgroundColor }}
							/>
						) : preview === null && (
							<Text style={[styles.unavailable, { color }]}>Couldn’t preview this post.</Text>
						)}
					</View>
				</View>
				{!loading && (
					<Pressable accessibilityRole="link" onPress={openPost} style={({ pressed }) => [
						detailStyles.bookDetailsBookshelves,
						detailStyles.bookDetailsButton,
						styles.openButton,
						pressed && detailStyles.bookDetailsButtonPressed
					]}>
						<Text style={[detailStyles.bookDetailsBookshelfTitle, styles.openTitle]}>Open {hostname || "original post"}</Text>
					</Pressable>
				)}
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	pane: { overflow: "hidden" },
	// Measure the content independently of the pane's animated height.
	content: { position: "absolute", top: 0, left: 0, right: 0, paddingVertical: panePadding, gap: 16 },
	hiddenContent: { opacity: 0 },
	row: { paddingTop: 5, paddingHorizontal: 20, flexDirection: "row", gap: 16, alignItems: "flex-start" },
	avatar: { width: 48, height: 48, borderRadius: 24 },
	body: { flex: 1, minWidth: 0, minHeight: 48, justifyContent: "center" },
	spinner: { alignSelf: "center", height: spinnerHeight, marginTop: panePadding },
	unavailable: { fontSize: 16 },
	openButton: { alignSelf: "center", paddingVertical: 10 },
	openTitle: { flex: 0, flexShrink: 1, textAlign: "center" }
});
