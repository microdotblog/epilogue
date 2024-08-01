import React, { useState } from "react";
import type { Node } from "react";
import { Alert, TextInput, ActivityIndicator, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View, FlatList } from "react-native";
import { NavigationContainer, useFocusEffect } from "@react-navigation/native";
import { DOMParser } from "@xmldom/xmldom";
import FastImage from "react-native-fast-image";
var showdown  = require("showdown");

import { keys } from "../Constants";
import { useEpilogueStyle } from '../hooks/useEpilogueStyle';
import epilogueStorage from "../Storage";

export function ProfileScreen({ navigation }) {
	const styles = useEpilogueStyle()
	const [ username, setUsername ] = useState("");
	const [ hostname, setHostname ] = useState("Micro.blog");
	const [ posts, setPosts ] = useState([]);
	const [ isDownloading, setDownloading ] = useState(true);
	const [ blogName, setBlogName ] = useState();

	var isCancelDownload = false;

    useFocusEffect(
		React.useCallback(() => {
			onFocus(navigation);
			
			return () => {
				onBlur(navigation);
			};
		}, [])
	);
		
	function onFocus(navigation) {
		isCancelDownload = false;

		clearDraft();		
		setupSignOutButton();
		loadPosts();
		
		epilogueStorage.get(keys.currentUsername).then(current_username => {
			setUsername(current_username);
		});

		epilogueStorage.get(keys.currentBlogName).then(blog_name => {
			if ((blog_name != undefined) && (blog_name.length > 0)) {
				setBlogName(blog_name);
			}
			else {
				setBlogName("");
			}
		});

		epilogueStorage.get(keys.micropubURL).then(micropub_url => {
			if ((micropub_url == undefined) || micropub_url.includes("micro.blog")) {
				setHostname("Micro.blog");
			}
			else {
				let pieces = micropub_url.split("/");
				let hostname = pieces[2];
				setHostname(hostname);
			}
		});
	}

	function onBlur(navigation) {
		isCancelDownload = true;
	}

	function clearDraft() {
		epilogueStorage.set(keys.currentTitle, "");
		epilogueStorage.set(keys.currentText, "");
		epilogueStorage.set(keys.currentTextExtra, "");				
	}

	function loadPosts(offset = 0, previous_posts = []) {
		if (isCancelDownload) {
			return;
		}
		
		epilogueStorage.get(keys.authToken).then(auth_token => {
			var use_token = auth_token;
			epilogueStorage.get(keys.micropubToken).then(micropub_token => {
				if (micropub_token != undefined) {
					use_token = micropub_token;
				}
	
				var options = {
					headers: {
						"Authorization": "Bearer " + use_token
					}
				};
	
				epilogueStorage.get(keys.micropubURL).then(micropub_url => {
					epilogueStorage.get(keys.currentBlogID).then(blog_id => {
						var use_url = micropub_url;
						if (use_url == undefined) {
							use_url = "https://micro.blog/micropub";
						}
						
						if (use_url.includes("?")) {
							use_url = use_url + "&q=source&offset=" + offset;
						}
						else {
							use_url = use_url + "?q=source&offset=" + offset;
						}
						
						use_url = use_url + "&filter=" + encodeURIComponent("micro.blog/books/")
						
						if ((blog_id != null) && (blog_id.length > 0)) {							
							use_url = use_url + "&mp-destination=" + encodeURIComponent(blog_id);
						}
											
						fetch(use_url, options).then(response => response.json()).then(data => {
							var new_items = previous_posts;
							const html_parser = new DOMParser({ onError: (error) => {
								// silently ignore errors
							}});							
							const md_parser = new showdown.Converter();
							const num_posts = data.items.length;
							
							for (let item of data.items) {
								const markdown = item.properties.content[0];
								if (markdown.includes("micro.blog/books/")) {
									// convert from Markdown and parse HTML
									const html = "<html>" + md_parser.makeHtml(markdown) + "</html>";
									const doc = html_parser.parseFromString(html, "text/html");
									const text = doc.documentElement.textContent;
									const display_text = text.replace("📚", "");
									const date_s = item.properties.published[0].slice(0, 10);
																		
									// try to get the book ISBN
									let isbn = "";
									let cover_url = "";
									const a_tags = doc.getElementsByTagName("a");
									for (let i = 0; i < a_tags.length; i++) {
										if (isbn.length == 0) {
											const a_tag = a_tags[i];
											const href = a_tag.getAttribute("href");
											if (href && href.includes("micro.blog/books/")) {
												const pieces = href.split("/");
												isbn = pieces[pieces.length - 1];
												cover_url = `https://micro.blog/books/${isbn}/cover.jpg`;
											}
										}
									}
																		
									new_items.push({
										id: item.properties.uid[0],
										url: item.properties.url[0],
										text: markdown,
										display_text: display_text,
										posted_at: date_s,
										isbn: isbn,
										cover_url: cover_url
									});
								}
							}
	
							if (offset == 0) {
								// if first hit, show recent posts right away
								setPosts(new_items);
							}
	
							if (num_posts == 0) {
								// got all the posts, refresh list
								setPosts(new_items);
								setDownloading(false);
							}
							else {
								// keep paging through more posts
								setTimeout(function() {
									const new_offset = offset + num_posts;
									loadPosts(new_offset, new_items);
								}, 500);
							}
						});
					});
				});
			});
		});
	}
	
	function onChangePressed() {
		navigation.navigate("External");
	}

	function onSignOut() {		
		Alert.alert("Sign out of Epilogue?", "", [
		  {
			text: "Cancel",
			style: "cancel"
		  },
		  {
			text: "Sign Out",
			onPress: () => {
			  clearSettings();
			  navigation.goBack();
			}
		  }
		]);
	}
	  
	function clearSettings() {
		epilogueStorage.remove(keys.authToken);
		epilogueStorage.remove(keys.currentUsername);		
		epilogueStorage.remove(keys.currentBlogID);
		epilogueStorage.remove(keys.currentBlogName);
		epilogueStorage.remove(keys.currentBookshelf);
		epilogueStorage.remove(keys.currentSearch);
		epilogueStorage.remove(keys.currentText);
		epilogueStorage.remove(keys.currentPostURL);
		epilogueStorage.remove(keys.allBookshelves);
		epilogueStorage.remove(keys.meURL);
		epilogueStorage.remove(keys.authState);
		epilogueStorage.remove(keys.authURL);
		epilogueStorage.remove(keys.tokenURL);
		epilogueStorage.remove(keys.micropubURL);
		epilogueStorage.remove(keys.micropubToken);
		epilogueStorage.remove(keys.lastMicropubToken);
		epilogueStorage.remove(keys.appleUserID);
		epilogueStorage.remove(keys.appleIdentityToken);
	}

	function setupSignOutButton() {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onSignOut(); }}>
			  	<Text style={styles.navbarSubmit}>Sign Out</Text>
			  </Pressable>
			)
		});		
	}
	
	function onShowBlogs() {
		navigation.navigate("Blogs");
	}
	
	function onEditPost(item) {
		const s = item.text;
		const url = item.url;

		epilogueStorage.set(keys.currentPostURL, url).then(() => {
			epilogueStorage.set(keys.currentText, s).then(() => {
				const params = {
					books: []
				};
				navigation.navigate("Post", params);
			});
		});
	}
	
	return (
		<View style={styles.container}>
			<View style={styles.profilePane}>
				<Image style={styles.profilePhoto} source={{ uri: "https://micro.blog/" + username + "/avatar.jpg" }} />
				<Text style={styles.profileUsername}>@{username}</Text>
				<View style={styles.profileExtras}>
					{ !isDownloading &&
						<Pressable onPress={() => { onShowBlogs(); }}>
							<Text style={styles.profileStatus}>{blogName}</Text>
						</Pressable>
					}
					{ isDownloading && 
						<Text style={styles.profileStatus}>Downloading posts</Text>
					}
					{ isDownloading &&
						<ActivityIndicator style={styles.profileSpinner} animating={isDownloading} hidesWhenStopped={true} />						
					}
				</View>
			</View>
			<View style={styles.micropubPane}>
				<Text style={styles.micropubHostname}>Posting to: {hostname}</Text>
				<Pressable style={styles.micropubButton} onPress={() => { onChangePressed(); }}>
					<Text style={styles.micropubButtonTitle} accessibilityLabel="change posting blog">Change...</Text>
				</Pressable>
			</View>
			<FlatList
				style={styles.profilePosts}
				data = {posts}
				renderItem = { ({item}) => 
				<Pressable onPress={() => { onEditPost(item) }}>
					<View style={styles.profilePost}>
						<FastImage style={styles.profilePostCover} source={{ uri: item.cover_url }} />
						<View style={styles.profilePostContent}>
							<Text style={styles.profilePostText} ellipsizeMode="tail" numberOfLines={4}>{item.display_text}</Text>
							<Text style={styles.profilePostDate}>{item.posted_at}</Text>
						</View>
					</View>
				</Pressable>
				}
				keyExtractor = { item => item.id }
			/>
		</View>
	);
}
