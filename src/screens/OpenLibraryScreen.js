import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, FlatList, StyleSheet, Text, View, TextInput } from "react-native";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Book } from "../Book";

export function OpenLibraryScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const [ username, setUsername ] = useState("");
	const [ password, setPassword ] = useState("");
	const [ hasSession, setHasSession ] = useState(false);
	const [ isSigningIn, setIsSigningIn ] = useState(false);
	const [ sessionToken, setSessionToken ] = useState("");
	const [ books, setBooks ] = useState([]);
    const passwordRef = useRef();

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	

	const onFocus = (navigation) =>  {
		setupProfileIcon();
		epilogueStorage.get(keys.openLibrarySession).then(saved_session => {
			setSessionToken(saved_session);
			setHasSession(true);
		});
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
	
	function onNextField() {
		passwordRef.current.focus();
	}

	function onSubmitSignin() {
		if (password.length == 0) {
			return;
		}

		setIsSigningIn(true);
		
		let form = new FormData();
		form.append("username", username);
		form.append("password", password);
		
		var options = {
			method: "POST",
			body: form
		};
		fetch("https://micro.blog/books/openlibrary/signin", options).then(response => response.json()).then(data => {
			var new_session = data["session"];

			setIsSigningIn(false);
			
			if (new_session.length > 0) {
				setSessionToken(new_session);
				setHasSession(true);
				epilogueStorage.set(keys.openLibrarySession, new_session);
			}
		});
	}
	
	function onShowProfile() {
		navigation.navigate("Profile");
	}

	function onSignOut() {
		setUsername("");
		setPassword("");
		setSessionToken("");
		setHasSession(false);
		epilogueStorage.remove(keys.openLibrarySession);
	}
	
	function onChangeSearch(text) {		
		// if we're clearing the text, wait a second and then send it
		// otherwise the user is still typing
		if (text.length == 0) {
			setTimeout(function() {
				epilogueStorage.remove(keys.currentSearch).then(() => {
					epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
						setBooks([]);
					});
				});
			}, 500);
		}
		else {
			epilogueStorage.set(keys.currentSearch, text);
		}
	}
	
	function onRunSearch() {
		epilogueStorage.get(keys.currentSearch).then(search_text => {
			let s = String(search_text);
			if ((s != "null") && (s.length > 0)) {
				sendSearch(s);
			}
			else {
				epilogueStorage.remove(keys.currentSearch).then(() => {
					epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
						setBooks([]);
					});				
				});
			}
		});
	}
	
	function sendSearch(searchText) {
		Book.searchOpenLibrary(searchText, function(new_books) {				
			if (new_books.length > 0) {				
				var new_items = [];
			
				for (b of new_books) {
					new_items.push({
						id: b.id,
						isbn: b.isbn,
						title: b.title,
						image: b.cover_url,
						author: b.author,
						description: b.description,
						is_search: true
					});
				}
			
				setBooks(new_items);
			}
			else {
				setBooks([]);
			}
		});
	}

	function onShowBookPressed(item) {
		var params = {};
		navigation.navigate("Editions", params);
	}
	
	return (
		<View style={styles.container}>		
			<View style={styles.openLibraryBanner}>
				<Text style={styles.openLibraryIntro}>Sign in with an account on the Internet Archive's Open Library to update book info and covers. Everyone using Open Library or Epilogue will be able to use your book covers.</Text>
			</View>
			{ !hasSession && 
				<View style={styles.openLibrarySignin}>
					<TextInput style={styles.openLibraryUsername} value={username} onChangeText={setUsername} onEndEditing={onNextField} returnKeyType="next" placeholder="Username" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoFocus={true} />
					<TextInput style={styles.openLibraryPassword} value={password} onChangeText={setPassword} onEndEditing={onSubmitSignin} returnKeyType="done" placeholder="Password" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} secureTextEntry={true} ref={passwordRef} />
					{ isSigningIn &&
						<ActivityIndicator style={styles.openLibrarySigninSpinner} animating={isSigningIn} hidesWhenStopped={true} />
					}				
				</View>
			}
			{ hasSession && 
				<View style={styles.openLibrarySession}>
					<View style={styles.openLibraryStatusBar}>
						<Text style={styles.openLibraryStatusUsername}>Signed in as: {username}</Text>
						<Pressable style={styles.micropubButton} onPress={() => { onSignOut(); }}>
							<Text style={styles.micropubButtonTitle}>Sign Out</Text>
						</Pressable>
					</View>
					<TextInput style={[ styles.searchField, styles.openLibrarySearch ]} onChangeText={onChangeSearch} onEndEditing={onRunSearch} returnKeyType="search" placeholder="Search for books to edit" placeholderTextColor="#6d6d72" clearButtonMode="always" />
					
					<FlatList
						data = {books}
						renderItem = { ({item}) => 						
						<Pressable onPress={() => {
								onShowBookPressed(item);
							}}>
							<View style={styles.item}>
								<FastImage style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
								<View style={styles.bookItem}>
									<Text style={styles.bookTitle} ellipsizeMode="tail" numberOfLines={2}>{item.title}</Text>
									<Text style={styles.bookAuthor}>{item.author}</Text>
								</View>
							</View>
						</Pressable>
						}
						keyExtractor = { item => item.id }
					/>
				</View>
			}
		</View>
	)
}