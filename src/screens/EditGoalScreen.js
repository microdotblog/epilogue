import React, { useState, useRef } from "react";
import { Pressable, FlatList, Image, View, TouchableOpacity, Text, TextInput, ActivityIndicator, Platform, Keyboard, useColorScheme } from 'react-native';

import { keys } from "../Constants";
import { useEpilogueStyle } from '../hooks/useEpilogueStyle';
import epilogueStorage from "../Storage";
import { Icon } from "../Icon";

export function EditGoalScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
    const is_dark = (useColorScheme() == "dark");
	const [ goalValue, setGoalValue ] = useState();
	const [ books, setBooks ] = useState();
	const inputRef = useRef();
	const { id, name, year } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		setupNavTitle();
		loadBooks();
	}

	function loadBooks() {
		epilogueStorage.get(keys.authToken).then(auth_token => {
			var options = {
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
						
			fetch("https://micro.blog/books/goals/" + id, options).then(response => response.json()).then(data => {
				var new_items = [];
				for (let item of data.items) {
					var author_name = "";
					if (item.authors.length > 0) {
						author_name = item.authors[0].name;
					}
					new_items.push({
						id: item.id,
						isbn: item._microblog.isbn,
						title: item.title,
						image: item.image,
						author: author_name,
					});
				}
				
				setBooks(new_items);
				setupBookParams(new_items);
				setupPostDraft();
			});		
		});
	}

	function setupNavTitle() {
		navigation.setOptions({
			title: name
		});		
	}
	
	function setupBookParams(books) {
		let params = {
			books: books
		};
		
		navigation.setOptions({
			headerRight: () => (
		  	<Pressable onPress={() => { navigation.navigate("Post", params); }} hitSlop={10}>
				<Icon name="publish" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarNewIcon} accessibilityLabel="new post" />
		  	</Pressable>
			)
		});				
	}
	
	function setupPostDraft() {
		let title = "Year in books for " + year;
		let s = "Here are the books I finished reading in " + year + ".";
		let extra = "\n\n{{< bookgoals " + year + " >}}";
		
		epilogueStorage.set(keys.currentTitle, title);
		epilogueStorage.set(keys.currentText, s);
		epilogueStorage.set(keys.currentTextExtra, extra);
		epilogueStorage.remove(keys.currentPostURL);
	}

	function onUpdateValue() {
		let new_value = inputRef.current.value;

		let form = new FormData();
		form.append("value", new_value);
						
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				method: "POST",
				body: form,
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};

			let url = "https://micro.blog/books/goals/" + id;
			fetch(url, options).then(response => response.json()).then(data => {
				navigation.goBack();
			});
		});
	}

	function onChangeText(text) {
		setGoalValue(text);
		inputRef.current.value = text;
	}

	return (
		<View style={styles.container}>
			<Text style={styles.editGoalTitle}>Set a new reading goal for {year}.</Text>
			<Text style={styles.editGoalDescription}>Micro.blog will update the progress toward your goal when you blog about a book you finished reading.</Text>
			
			<View style={styles.editGoalFieldAndButton}>			
				<TextInput style={styles.editGoalInput} value={goalValue} onChangeText={onChangeText} multiline={false} autoFocus={true} keyboardType={"number-pad"} ref={inputRef} placeholder="Number of books to read" />
				<Pressable onPress={() => { onUpdateValue(); }} style={({ pressed }) => [
					styles.editGoalButton,
					(pressed ? styles.bookDetailsButtonPressed : styles.editGoalButton)
				]}>
					<Text style={styles.editGoalButtonTitle}>Update</Text>
				</Pressable>
			</View>

			<FlatList
				data = {books}
				renderItem = { ({item}) => 
					<View style={styles.item}>
						<Image style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
						<View style={styles.bookItem}>
							<Text style={styles.bookTitle} ellipsizeMode="tail" numberOfLines={2}>{item.title}</Text>
							<Text style={styles.bookAuthor}>{item.author}</Text>
						</View>
					</View>
				}
				keyExtractor = { item => item.id }
				style = {styles.editGoalBooks}
				onScrollBeginDrag = {() => Keyboard.dismiss()}
			/>
		</View>
	)
}