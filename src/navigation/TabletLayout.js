import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from "react-native";
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
	const selectedBackground = { backgroundColor: dark ? "#34343A" : "#D9D9DE" };
	const textColor = { color: dark ? "white" : "black" };

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
										<View style={styles.row} accessibilityRole="header">
											<Icon name="bookshelves" size={24} color={tint} />
											<Text style={[styles.label, textColor]}>Bookshelves</Text>
										</View>
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
	shelfRow: { paddingLeft: 24 },
	shelfLabel: { fontSize: 16, flex: 1 },
});
