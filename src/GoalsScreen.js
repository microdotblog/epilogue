import React, { useState } from "react";
import { Pressable, FlatList, Image, View, ScrollView, TouchableOpacity, Text, ActivityIndicator, Platform, useColorScheme, useWindowDimensions } from 'react-native';
import FastImage from "react-native-fast-image";

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";
import { Icon } from "./Icon";

export function GoalsScreen({ navigation }) {
	const windowSize = useWindowDimensions();
	const styles = useEpilogueStyle();
	const is_dark = (useColorScheme() == "dark");
	const [ goals, setGoals ] = useState([]);
	const [ bannerYear, setBannerYear ] = useState();
	const [ bannerCount, setBannerCount ] = useState();
	const [ bannerBooks, setBannerBooks ] = useState([]);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		setupPostDraftForBanner();		
		setupProfileIcon();
		loadGoals();
	}

	function loadGoals() {		
		// show banner if goal for previous year
		let previous_year = new Date().getFullYear() - 1;
		let this_month = new Date().getMonth();
		var has_banner = false;
		
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
			
			fetch("https://micro.blog/books/goals", options).then(response => response.json()).then(data => {
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

	function setupProfileIcon() {
		epilogueStorage.get(keys.currentUsername).then(username => {
			let avatar_url = "https://micro.blog/" + username + "/avatar.jpg";
			navigation.setOptions({
				headerLeft: () => (
					<Pressable onPress={() => { onShowProfile(); }} accessibilityRole="button" accessibilityLabel="show profile">
						<Image style={styles.profileIcon} source={{ uri: avatar_url }} />
					</Pressable>
				)
			});		
		});
	}	

	function onShowProfile() {
		navigation.navigate("Profile");
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
						<Icon name="publish" size={18} color={is_dark ? "#FFFFFF" : "#337AB7"} style={styles.goalsBannerIcon} />
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
		<View style={styles.goalsContainer}>
			<BannerView year={bannerYear} count={bannerCount} />
			<FlatList
				data = {goals}
				renderItem = { ({item}) => 
					<Pressable style={styles.goalItem} onPress={() => { onSelectGoal(item) }}>
						<View style={styles.goalDetails}>
							<Text style={styles.goalName}>{item.name}</Text>
							<ProgressStatus progress={item.progress} value={item.value} />
						</View>
						<View style={styles.goalCovers}>
							<FlatList
								horizontal = {true}
								data = {item.isbns}
								renderItem = {({ item: isbn }) => {
									return renderCoverItem(item, isbn);
								}}
							/>
						</View>
					</Pressable>
				}
				keyExtractor = { item => item.id }
			/>
		</View>
	)
}