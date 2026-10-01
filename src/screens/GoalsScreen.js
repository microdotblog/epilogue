import React, { useState } from "react";
import { Button, Pressable, FlatList, Image, View, ScrollView, TouchableOpacity, Text, Platform, RefreshControl, StyleSheet, useColorScheme, useWindowDimensions } from 'react-native';
import { useScrollToTop } from "@react-navigation/native";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Icon } from "../Icon";
import { useProfileHeader } from "../ProfileHeaderButton";
import { findBookCalendarPage } from "../CalendarData";
import { CalendarScreen } from "./CalendarScreen";

export function GoalsScreen({ navigation }) {
	const windowSize = useWindowDimensions();
	const styles = useEpilogueStyle();
	useProfileHeader(navigation, styles);
	const is_dark = (useColorScheme() == "dark");
	const [ goals, setGoals ] = useState([]);
	const [ bannerYear, setBannerYear ] = useState();
	const [ bannerCount, setBannerCount ] = useState();
	const [ bannerBooks, setBannerBooks ] = useState([]);
	const [ refreshing, setRefreshing ] = useState(false);
	const [ selectedView, setSelectedView ] = useState("goals");
	const [ calendarOpened, setCalendarOpened ] = useState(false);
	const [ calendarPage, setCalendarPage ] = useState({ status: "idle" });
	const calendarPageRequest = React.useRef(0);
	const goalsListRef = React.useRef(null);

	useScrollToTop(goalsListRef);
	React.useEffect(() => () => { calendarPageRequest.current += 1; }, []);
	React.useEffect(() => {
		if (selectedView === "calendar") loadCalendarPage();
	}, [selectedView]);

	React.useEffect(() => {
		const control = (
			<View style={[segmentStyles.control, { backgroundColor: is_dark ? "#34343A" : "#E9E9EB" }]}>
				{[{ id: "goals", title: "Goals" }, { id: "calendar", title: "Calendar" }].map(item => (
					<Pressable key={item.id} testID={`goals-view-${item.id}`} accessibilityRole="tab"
						accessibilityLabel={item.title} accessibilityState={{ selected: selectedView === item.id }}
						onPress={() => {
							if (item.id === "calendar" && selectedView !== "calendar") {
								setCalendarOpened(true);
								setCalendarPage({ status: "loading" });
							}
							setSelectedView(item.id);
						}}
						style={[segmentStyles.segment, selectedView === item.id && {
							backgroundColor: is_dark ? "#636366" : "#FFFFFF",
							shadowOpacity: is_dark ? 0 : 0.12
						}]}>
						<Text style={[segmentStyles.label, { color: is_dark ? "#FFFFFF" : selectedView === item.id ? "#1C1C1E" : "#6B6B70" }]}>{item.title}</Text>
					</Pressable>
				))}
			</View>
		);
		const pageButtonTitle = calendarPage.page ? "Edit Page" : "New Page";
		const showPageButton = selectedView === "calendar" && calendarPage.status === "ready";
		const showRetryButton = selectedView === "calendar" && calendarPage.status === "error";
		navigation.setOptions({
			headerTitle: () => control,
			headerTitleAlign: "center",
			...(Platform.OS === "ios" ? {
				unstable_headerRightItems: () => showPageButton ? [{ type: "button", label: pageButtonTitle,
					icon: { type: "sfSymbol", name: "square.and.pencil" }, onPress: openCalendarPage }] :
					showRetryButton ? [{ type: "button", label: "Retry", onPress: loadCalendarPage }] : []
			} : {
				headerRight: () => showPageButton ? (
					<Pressable onPress={openCalendarPage} hitSlop={10} accessibilityRole="button" accessibilityLabel={pageButtonTitle}>
						<Icon name="publish" color={is_dark ? "#FFFFFF" : "#000000"} size={18} style={styles.navbarNewIcon} />
					</Pressable>
				) : showRetryButton ? <Button title="Retry" onPress={loadCalendarPage} /> : null
			})
		});
	}, [navigation, is_dark, selectedView, calendarPage]);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			if (selectedView === "goals") onFocus(navigation);
			else loadCalendarPage();
		});
		return unsubscribe;
	}, [navigation, selectedView]);

	async function loadCalendarPage() {
		const request = ++calendarPageRequest.current;
		setCalendarPage({ status: "loading" });
		try {
			const [token, blogID, blogName] = await Promise.all([
				epilogueStorage.get(keys.authToken),
				epilogueStorage.get(keys.currentBlogID),
				epilogueStorage.get(keys.currentBlogName)
			]);
			if (!token) throw new Error("Missing sign-in token");
			let page = null;
			let offset = 0;
			while (true) {
				const destination = blogID ? `&mp-destination=${encodeURIComponent(blogID)}` : "";
				const url = `https://micro.blog/micropub?q=source&mp-channel=pages${destination}&limit=100&offset=${offset}`;
				const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
				if (!response.ok) throw new Error("Could not load standalone pages");
				const data = await response.json();
				if (!Array.isArray(data.items)) throw new Error("Invalid standalone pages response");
				page = findBookCalendarPage(data.items);
				if (page || data.items.length < 100) break;
				offset += data.items.length;
			}
			if (request === calendarPageRequest.current) {
				setCalendarPage({ status: "ready", page, blogID: blogID || "", blogName: blogName || "" });
			}
		} catch {
			if (request === calendarPageRequest.current) setCalendarPage({ status: "error" });
		}
	}

	function openCalendarPage() {
		navigation.navigate("Post", {
			books: [],
			calendarMode: true,
			calendarPage: calendarPage.page,
			calendarBlogID: calendarPage.blogID,
			calendarBlogName: calendarPage.blogName
		});
	}
	
	function onFocus(navigation) {
		setupPostDraftForBanner();		
		loadGoals();
	}

	function loadGoals() {		
		// show banner if goal for previous year
		let previous_year = new Date().getFullYear() - 1;
		let this_month = new Date().getMonth();
		var has_banner = false;
		
		return epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
			
			return fetch("https://micro.blog/books/goals", options).then(response => response.json()).then(data => {
				var new_goals = [];
				for (let item of data.items) {
					var g = {
						id: item.id,
						name: item.title,
						year: item._microblog.goal_year,
						value: item._microblog.goal_value,
						progress: item._microblog.goal_progress,
						isbns: item._microblog.isbns
					};
					
					new_goals.push(g);
					
					if (g.year == previous_year) {
						has_banner = true;						
						var banner_books = [];
						for (let isbn of g.isbns) {
							// we don't have all data, just fill in basics
							banner_books.push({
								id: isbn,
								isbn: isbn,
								title: "",
								image: "https://cdn.micro.blog/books/" + isbn + "/cover.jpg",
								author: ""
							});
						}
						
						setBannerYear(g.year);
						setBannerCount(g.progress);
						setBannerBooks(banner_books);
						setupPostDraftForYear(g.year);
					}
				}
				
				// if past February, don't show banner
				if (this_month >= 2) {
					has_banner = false;
				}
				
				// set goals and cancel banner if not needed
				setGoals(new_goals);
				if (!has_banner) {
					setBannerYear(undefined);
				}
			});
		});
	}

	const onRefresh = React.useCallback(() => {
		setRefreshing(true);
		loadGoals()
			.catch(error => {
				console.log("Error refreshing goals", error);
			})
			.finally(() => {
				setRefreshing(false);
			});
	}, []);

	function onSelectGoal(item) {		
		var params = {
			id: item.id,
			name: item.name,
			year: item.year
		};
		navigation.navigate("EditGoal", params);
	}

	function setupPostDraftForBanner() {
		if (bannerYear != undefined) {
			setupPostDraftForYear(bannerYear);
		}
	}

	function setupPostDraftForYear(year) {
		let title = "Year in books for " + year;
		let s = "Here are the books I finished reading in " + year + ".";
		let extra = "\n\n{{< bookgoals " + year + " >}}";
		
		epilogueStorage.set(keys.currentTitle, title);
		epilogueStorage.set(keys.currentText, s);
		epilogueStorage.set(keys.currentTextExtra, extra);
		epilogueStorage.remove(keys.currentPostURL);
	}
	const ProgressStatus = ({ progress, value }) => {
		if (value == 0) {
			return (
				<Text style={styles.goalProgress}>No goal set</Text>
			)
		}
		else {
			return (
				<Text style={styles.goalProgress}>{progress} of {value} books</Text>
			)
		}
	}

	const BannerView = ({ year, count }) => {
		if ((year == undefined) || (count == 0)) {
			return null;
		}
		else {
			let params = {
				books: bannerBooks
			};
			
			// adjust button size based on scale
			// won't be perfect at larger scales but won't clip
			var button_width = 190 * windowSize.fontScale;
			
			return (
				<View style={styles.goalsBanner}>
					<Text style={styles.goalsBannerText}>You finished {bannerCount} books in {bannerYear}. Start a new blog post linking to all of them.</Text>
					<Pressable onPress={() => { navigation.navigate("Post", params); }} style={[styles.goalsBannerButton, { width: button_width }]}>
						<Icon name="publish" size={18} color={is_dark ? "#FFFFFF" : "#000000"} style={styles.goalsBannerIcon} />
						<Text style={styles.goalsBannerButtonTitle}>Year in books for {bannerYear}</Text>
					</Pressable>
				</View>			
			)
		}
	}

	function renderCoverItem(goalItem, isbn) {
		return (
			<Pressable onPress={() => { onSelectGoal(goalItem) }}>
				<FastImage style={styles.goalCoverThumbnail} source={{ uri: "https://micro.blog/books/" + isbn + "/cover.jpg" }} />
			</Pressable>
		)
	}

	return (
		<View style={segmentStyles.screen}>
			<View style={[styles.goalsContainer, selectedView !== "goals" && segmentStyles.hidden]}>
				<FlatList
					contentInsetAdjustmentBehavior="automatic"
					ref={goalsListRef}
					data = {goals}
					renderItem = { ({item}) =>
						<Pressable style={styles.goalItem} onPress={() => { onSelectGoal(item) }}>
							<View style={styles.goalDetails}>
								<Text style={styles.goalName}>{item.name}</Text>
								<ProgressStatus progress={item.progress} value={item.value} />
							</View>
							<View style={styles.goalCovers}>
								<FlatList
									style = {{ marginRight: 80 }}
									horizontal = {true}
									data = {item.isbns}
									renderItem = {({ item: isbn }) => {
										return renderCoverItem(item, isbn);
									}}
									showsHorizontalScrollIndicator = {false}
								/>
							</View>
						</Pressable>
					}
					ListHeaderComponent = {
						<BannerView year={bannerYear} count={bannerCount} />
					}
					refreshControl = {
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
					}
					keyExtractor = { item => item.id }
				/>
			</View>
			{calendarOpened && <View style={[segmentStyles.screen, selectedView !== "calendar" && segmentStyles.hidden]}>
				<CalendarScreen navigation={navigation} pageLoading={calendarPage.status === "loading"} />
			</View>}
		</View>
	)
}

const segmentStyles = StyleSheet.create({
	screen: { flex: 1 },
	hidden: { display: "none" },
	control: { flexDirection: "row", padding: 3, borderRadius: 10 },
	segment: { height: 32, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", borderRadius: 7,
		shadowColor: "#000000", shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 0 },
	label: { fontSize: 14, fontWeight: "600" }
});
