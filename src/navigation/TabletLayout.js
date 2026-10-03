import React from "react";
import { AccessibilityInfo, Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from "react-native";
import { ScreenStack, ScreenStackItem, ScreenStackHeaderLeftView } from "react-native-screens";
import { SafeAreaView, Split } from "react-native-screens/experimental";

import { Icon } from "../Icon";
import { useProfileAvatar } from "../ProfileHeaderButton";
import { SidebarBookshelvesContext, SidebarVisibleContext } from "./SidebarContext";

export function isWideTabletWindow(width, height) {
	return width >= 768 && width > height;
}

const icons = { Bookshelves: "bookshelves", Goals: "goals", Movies: "movies", Discover: "discover" };

export function TabletLayout({ state, navigation, children }) {
	const { width, height } = useWindowDimensions();
	const wide = isWideTabletWindow(width, height);
	const [collapsed, setCollapsed] = React.useState(false);
	const sidebarVisible = wide && !collapsed;
	const dark = useColorScheme() === "dark";
	const avatar = useProfileAvatar(navigation);
	const tint = dark ? "#FFB45A" : "#C85F00";
	const [shelfMenu, setShelfMenu] = React.useState(null);
	const [shelvesExpanded, setShelvesExpanded] = React.useState(true);
	const [shelfHeight, setShelfHeight] = React.useState(null);
	const disclosureProgress = React.useRef(new Animated.Value(1)).current;
	const reduceMotion = React.useRef(false);
	const selectedBackground = { backgroundColor: dark ? "#34343A" : "#D9D9DE" };
	const textColor = { color: dark ? "white" : "black" };

	React.useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled().then(enabled => { reduceMotion.current = enabled; });
		const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", enabled => { reduceMotion.current = enabled; });
		return () => { subscription.remove(); disclosureProgress.stopAnimation(); };
	}, [disclosureProgress]);

	function toggleShelves() {
		const expanded = !shelvesExpanded;
		if (reduceMotion.current) {
			disclosureProgress.stopAnimation();
			disclosureProgress.setValue(expanded ? 1 : 0);
		} else {
			Animated.timing(disclosureProgress, {
				toValue: expanded ? 1 : 0,
				duration: 200,
				easing: Easing.inOut(Easing.ease),
				// Height changes must participate in layout to move the rows below.
				useNativeDriver: false
			}).start();
		}
		setShelvesExpanded(expanded);
	}

	return (
		<SidebarVisibleContext.Provider value={sidebarVisible}>
		<SidebarBookshelvesContext.Provider value={setShelfMenu}>
			<Split.Host
				preferredDisplayMode={wide ? "oneBesideSecondary" : "secondaryOnly"}
				preferredSplitBehavior="tile"
				primaryBackgroundStyle="sidebar"
				displayModeButtonVisibility="never"
				showSecondaryToggleButton={false}
				presentsWithGesture={false}
				topColumnForCollapsing="secondary"
				columnMetrics={{ minimumPrimaryColumnWidth: 240, maximumPrimaryColumnWidth: 320, preferredPrimaryColumnWidthOrFraction: 280 }}
				onCollapse={() => setCollapsed(true)}
				onExpand={() => setCollapsed(false)}
			>
				<Split.Column>
					<ScreenStack style={styles.fill}>
						<ScreenStackItem screenId="sidebar" headerConfig={{
							title: "", hideShadow: true, translucent: true,
							children: <ScreenStackHeaderLeftView hidesSharedBackground>
								<Pressable accessibilityLabel="show profile" accessibilityRole="button" hitSlop={10} onPress={() => navigation.navigate("Profile")}>
									<Image source={{ uri: avatar }} style={styles.avatar} />
								</Pressable>
							</ScreenStackHeaderLeftView>
						}}>
							<ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.sidebar}>
								{state.routes.map((route, index) => route.name === "Bookshelves" && shelfMenu?.bookshelves.length > 0 ? (
									<View key={route.key}>
										<Pressable style={styles.row} testID="sidebar-bookshelves-disclosure"
											accessibilityRole="button" accessibilityLabel="Bookshelves" accessibilityState={{ expanded: shelvesExpanded }}
											onPress={toggleShelves}>
											<Icon name="bookshelves" size={24} color={tint} />
											<Text style={[styles.label, textColor]}>Bookshelves</Text>
											<Animated.View style={[styles.disclosure, { transform: [{ rotate: disclosureProgress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] }) }] }]}>
												<Icon name="disclosure-right" size={12} color={dark ? "#98989F" : "#8E8E93"} />
											</Animated.View>
										</Pressable>
										<Animated.View testID="sidebar-shelf-container" pointerEvents={shelvesExpanded ? "auto" : "none"}
											accessibilityElementsHidden={!shelvesExpanded} importantForAccessibility={shelvesExpanded ? "auto" : "no-hide-descendants"}
											style={{ overflow: "hidden", height: disclosureProgress.interpolate({ inputRange: [0, 1], outputRange: [0, shelfHeight ?? 0] }) }}>
											{/* Measure independently of the animated height, including while collapsed. */}
											<View testID="sidebar-shelf-content" style={{ position: "absolute", top: 0, left: 0, right: 0 }} onLayout={event => setShelfHeight(event.nativeEvent.layout.height)}>
										{shelfMenu.bookshelves.map(shelf => {
											const selected = state.index === index && String(shelfMenu.selectedBookshelfID) === String(shelf.id);
											return <Pressable key={shelf.id} testID={`sidebar-shelf-${shelf.id}`} accessibilityRole="button"
												accessibilityState={{ selected }} onPress={() => {
													shelfMenu.onSelect(shelf);
													navigation.navigate("Bookshelves");
												}} style={[styles.row, styles.shelfRow, selected && selectedBackground]}>
												<Text style={[styles.shelfLabel, textColor]}>{shelf.title}</Text>
											</Pressable>;
										})}
											</View>
										</Animated.View>
									</View>
								) : (
									<Pressable key={route.key} testID={`sidebar-${route.name}`} accessibilityRole="tab" accessibilityState={{ selected: state.index === index }}
										onPress={() => navigation.navigate(route.name)}
										style={[styles.row, state.index === index && selectedBackground]}>
										<Icon name={icons[route.name]} size={24} color={tint} />
										<Text style={[styles.label, { color: dark ? "white" : "black" }]}>{route.name}</Text>
									</Pressable>
								))}
							</ScrollView>
						</ScreenStackItem>
					</ScreenStack>
				</Split.Column>
				<Split.Column>
					<SafeAreaView edges={{ left: true, right: true }}>{children}</SafeAreaView>
				</Split.Column>
			</Split.Host>
		</SidebarBookshelvesContext.Provider>
		</SidebarVisibleContext.Provider>
	);
}

const styles = StyleSheet.create({
	fill: { flex: 1 },
	avatar: { width: 28, height: 28, borderRadius: 14 },
	sidebar: { paddingHorizontal: 12, paddingTop: 12 },
	row: { flexDirection: "row", alignItems: "center", minHeight: 48, padding: 12, borderRadius: 12, marginBottom: 4 },
	label: { fontSize: 18, marginLeft: 12, flex: 1 },
	disclosure: { marginLeft: 8 },
	shelfRow: { paddingLeft: 24 },
	shelfLabel: { fontSize: 16, flex: 1 },
});
