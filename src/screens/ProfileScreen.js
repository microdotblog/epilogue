import React, { useState } from "react";
import type { Node } from "react";
import { Alert, TextInput, ActivityIndicator, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View, FlatList, useColorScheme, Animated } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { DOMParser } from "@xmldom/xmldom";
import * as Application from "expo-application";
import FastImage from "react-native-fast-image";
var showdown  = require("showdown");

import { keys } from "../Constants";
import { useEpilogueStyle } from '../hooks/useEpilogueStyle';
import epilogueStorage from "../Storage";
import { clearBookCaches } from "../BookshelfCache";

const profilePostSources = [
	{ filter: "micro.blog/books/", media_type: "book" },
	{ filter: "themoviedb.org", media_type: "movie" },
	{ filter: "letterboxd.com", media_type: "letterboxd" }
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export function ProfileScreen({ navigation }) {
	const styles = useEpilogueStyle()
	const colorScheme = useColorScheme();
	const is_dark = (colorScheme == "dark");
	const versionPaneOpacity = React.useRef(new Animated.Value(1)).current;
	const versionPaneTranslateY = React.useRef(new Animated.Value(0)).current;
	const hasHiddenVersionPane = React.useRef(false);
	const [ username, setUsername ] = useState("");
	const [ hostname, setHostname ] = useState("Micro.blog");
	const [ posts, setPosts ] = useState([]);
	const [ isDownloading, setDownloading ] = useState(true);
	const [ blogName, setBlogName ] = useState();
	const appVersionLabel = appVersionDisplayLabel();
	const appBuildLabel = appBuildDisplayLabel();

	var isCancelDownload = false;

    useFocusEffect(
		React.useCallback(() => {
			onFocus(navigation);
			
			return () => {
				onBlur(navigation);
			};
		}, [])
	);

	React.useLayoutEffect(() => {
		setupSignOutButton();
	}, [is_dark, styles]);
		
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

	function loadPosts() {
		const sources = profilePostSources.map(source => {
			return {
				...source,
				offset: 0,
				is_done: false
			};
		});

		loadNextPostsPage(sources, 0, [], false);
	}

	function loadNextPostsPage(sources, source_index, previous_posts, did_initial_update) {
		if (isCancelDownload) {
			return;
		}

		if (source_index == -1) {
			setPosts(sortPosts(previous_posts));
			setDownloading(false);
			return;
		}

		const source = sources[source_index];
		
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
								use_url = use_url + "&q=source&offset=" + source.offset;
							}
							else {
								use_url = use_url + "?q=source&offset=" + source.offset;
							}
							if (source.offset == 0) {
								use_url = use_url + "&limit=20";
							}
							use_url = use_url + "&filter=" + encodeURIComponent(source.filter);

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
									if (markdown.includes(source.filter)) {
										// convert from Markdown and parse HTML
										const html = "<html>" + md_parser.makeHtml(markdown) + "</html>";
										const doc = html_parser.parseFromString(html, "text/html");
										const text = doc.documentElement.textContent;
										const replace_emojis = [ "📚", "🍿", "📺", "🎥", "🎬" ];
										let display_text = text;
										for (const emoji of replace_emojis) {
											display_text = display_text.replaceAll(emoji, "");
										}
										const published_at = item.properties.published[0];
										const date_s = published_at.slice(0, 10);

										// try to get the book ISBN
										let isbn = "";
										let cover_url = "";
										if (source.media_type == "book") {
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
										}
										else if (source.media_type == "movie") {
											const thumbnail = item.properties["microblog-thumbnail"]?.[0];
											if ((thumbnail != null) && (thumbnail.length > 0)) {
												cover_url = thumbnail;
											}
										}

										new_items.push({
											id: item.properties.uid[0],
											url: item.properties.url[0],
											text: markdown,
											display_text: display_text,
											posted_at: date_s,
											published_at: published_at,
											media_type: source.media_type,
											isbn: isbn,
											cover_url: cover_url
										});
									}
								}

								const new_sources = sources.slice();
								if (num_posts == 0) {
									new_sources[source_index] = {
										...source,
										is_done: true
									};
								}
								else {
									new_sources[source_index] = {
										...source,
										offset: source.offset + num_posts
									};
								}

								const should_update = !did_initial_update && initialPostPagesLoaded(new_sources);
								if (should_update) {
									setPosts(sortPosts(new_items));
								}

								setTimeout(function() {
									const next_source_index = nextPostSourceIndex(new_sources, source_index);
									loadNextPostsPage(new_sources, next_source_index, new_items, did_initial_update || should_update);
								}, 500);
							});
					});
				});
			});
		});
	}

	function nextPostSourceIndex(sources, current_index) {
		for (let i = 1; i <= sources.length; i++) {
			const index = (current_index + i) % sources.length;
			if (!sources[index].is_done) {
				return index;
			}
		}

		return -1;
	}

	function initialPostPagesLoaded(sources) {
		return sources.every(source => {
			return source.is_done || source.offset > 0;
		});
	}

	function sortPosts(items) {
		return items.slice().sort((a, b) => {
			return (b.published_at || "").localeCompare(a.published_at || "");
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
		epilogueStorage.remove(keys.blogCount);
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
		clearBookCaches();
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

	function onNotesKeyPressed() {
		navigation.navigate("NotesKey");
	}

	function hideVersionPane() {
		if (hasHiddenVersionPane.current) {
			return;
		}

		hasHiddenVersionPane.current = true;
		Animated.parallel([
			Animated.timing(versionPaneOpacity, {
				toValue: 0,
				duration: 220,
				useNativeDriver: true
			}),
			Animated.timing(versionPaneTranslateY, {
				toValue: 16,
				duration: 220,
				useNativeDriver: true
			})
		]).start();
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
				<Pressable style={styles.micropubButton} onPress={() => { onNotesKeyPressed(); }}>
					<Text style={styles.micropubButtonTitle} accessibilityLabel="set secret key">Notes Key...</Text>
				</Pressable>
			</View>
			<AnimatedFlatList
				style={styles.profilePosts}
				contentContainerStyle={styles.profilePostsContent}
				data = {posts}
				onScrollBeginDrag={hideVersionPane}
				onMomentumScrollBegin={hideVersionPane}
				renderItem = { ({item}) => 
				<Pressable onPress={() => { onEditPost(item) }}>
					<View style={styles.profilePost}>
						{ item.cover_url.length > 0 ? (
							<FastImage style={styles.profilePostCover} source={{ uri: item.cover_url }} />
						) : (
							<View style={styles.profilePostCover} />
						)}
						<View style={styles.profilePostContent}>
							<Text style={styles.profilePostText} ellipsizeMode="tail" numberOfLines={4}>{item.display_text}</Text>
							<Text style={styles.profilePostDate}>{item.posted_at}</Text>
						</View>
					</View>
				</Pressable>
				}
				keyExtractor = { item => item.id }
			/>
			<Animated.View
				pointerEvents="none"
				style={[
					styles.profileVersionPaneContainer,
					{
						opacity: versionPaneOpacity,
						transform: [{ translateY: versionPaneTranslateY }]
					}
				]}
			>
				<View style={styles.profileVersionPane}>
					<Text style={styles.profileVersionText}>
						{appVersionLabel}
						{appBuildLabel.length > 0 ? (
							<Text style={styles.profileVersionBuildText}> {appBuildLabel}</Text>
						) : null}
					</Text>
				</View>
			</Animated.View>
		</View>
	);
}

function appVersionDisplayLabel() {
	const appVersion = Application.nativeApplicationVersion || "";
	const versionText = appVersion.length > 0 ? appVersion : "Unknown";

	return `Epilogue ${versionText}`;
}

function appBuildDisplayLabel() {
	const buildVersion = Application.nativeBuildVersion || "";

	if (buildVersion.length > 0) {
		return `(${buildVersion})`;
	}

	return "";
}
