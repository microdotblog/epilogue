import React, { useState } from "react";
import { Pressable, FlatList, Image, View, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";

export function GoalsScreen({ navigation }) {
	const styles = useEpilogueStyle();
	const [ goals, setGoals ] = useState([]);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		loadGoals();
	}

	function loadGoals() {
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
				}
				setGoals(new_goals);
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

	return (
		<View style={styles.goalsContainer}>
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
								renderItem = { ({isbn}) => 
									<Image style={styles.goalCoverThumbnail} source={{ uri: "https://micro.blog/books/" + isbn + "/cover.jpg" }} />
								}
							/>
						</View>
					</Pressable>
				}
				keyExtractor = { item => item.id }
			/>
		</View>
	)
}