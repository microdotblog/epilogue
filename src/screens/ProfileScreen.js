import React, { useState } from "react";
import type { Node } from "react";
import { Alert, TextInput, ActivityIndicator, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View, FlatList, useColorScheme, Animated, LayoutAnimation } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { DOMParser } from "@xmldom/xmldom";
import * as Application from "expo-application";
import FastImage from "react-native-fast-image";
var showdown  = require("showdown");

import { keys } from "../Constants";
import { useEpilogueStyle } from '../hooks/useEpilogueStyle';
import epilogueStorage from "../Storage";
import { clearBookCaches } from "../BookshelfCache";
import { Icon } from "../Icon";
import { readProfilePostsCache, writeProfilePostsCache, clearProfilePostsCaches, mergeProfilePosts } from "../ProfilePostsCache";

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
	const [ hasLoadedPosts, setHasLoadedPosts ] = useState(false);
	const [ isSearching, setSearching ] = useState(false);
	const [ searchText, setSearchText ] = useState("");
	const [ blogName, setBlogName ] = useState();
	const filteredPosts = React.useMemo(() => {
		const query = searchText.trim().toLowerCase();
		return query ? posts.filter(post => post.display_text.toLowerCase().includes(query)) : posts;
	}, [posts, searchText]);
	const appVersionLabel = appVersionDisplayLabel();
	const appBuildLabel = appBuildDisplayLabel();

	const activePostsLoad = React.useRef(0);

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
		activePostsLoad.current += 1;
	}

	function clearDraft() {
		epilogueStorage.set(keys.currentTitle, "");
		epilogueStorage.set(keys.currentText, "");
		epilogueStorage.set(keys.currentTextExtra, "");				
	}

	async function loadPosts() {
		const loadID = ++activePostsLoad.current;
		setDownloading(true);
		setHasLoadedPosts(false);
		setPosts([]);
		setSearching(false);
		setSearchText("");
		const [username, endpoint, blogID, authToken, micropubToken] = await Promise.all([
			keys.currentUsername, keys.micropubURL, keys.currentBlogID, keys.authToken, keys.micropubToken
		].map(key => epilogueStorage.get(key)));
		const context = {
			loadID,
			endpoint: endpoint || "https://micro.blog/micropub",
			blogID,
			token: micropubToken ?? authToken
		};
		context.cacheIdentity = [username || "", context.endpoint, blogID || ""];
		const cachedPosts = await readProfilePostsCache(context.cacheIdentity);
		if (loadID !== activePostsLoad.current) {
			return;
		}
		if (cachedPosts !== null) {
			setPosts(cachedPosts);
			setHasLoadedPosts(true);
		}
		const sources = profilePostSources.map(source => {
			return {
				...source,
				// Each filtered feed must reach its own newest cached post.
				latestCachedID: cachedPosts?.find(post => post.text.includes(source.filter))?.id,
				offset: 0,
				is_done: false
			};
		});

		loadNextPostsPage(context, sources, 0, cachedPosts || [], cachedPosts !== null);
	}

	function loadNextPostsPage(context, sources, source_index, previous_posts, did_initial_update) {
		if (context.loadID !== activePostsLoad.current) {
			return;
		}

		if (source_index == -1) {
			setPosts(previous_posts);
			setDownloading(false);
			setHasLoadedPosts(true);
			writeProfilePostsCache(context.cacheIdentity, previous_posts);
			return;
		}

		const source = sources[source_index];
		
		const options = { headers: { "Authorization": "Bearer " + context.token } };
		const blog_id = context.blogID;
		var use_url = context.endpoint;

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

		fetch(use_url, options).then(response => {
			if (response.ok === false) {
				throw new Error("Could not download posts");
			}
			return response.json();
		}).then(data => {
			if (context.loadID !== activePostsLoad.current) {
				return;
			}
			var new_items = [];
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
			const reached_cache = source.latestCachedID != null && data.items.some(item =>
				String(item.properties.uid[0]) === source.latestCachedID
			);
			if (num_posts == 0 || reached_cache) {
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
			const merged_posts = mergeProfilePosts(previous_posts, new_items);
			if (should_update) {
				setPosts(merged_posts);
			}

			setTimeout(function() {
				const next_source_index = nextPostSourceIndex(new_sources, source_index);
				loadNextPostsPage(context, new_sources, next_source_index, merged_posts, did_initial_update || should_update);
			}, 500);
		}).catch(error => {
			if (context.loadID === activePostsLoad.current) {
				setDownloading(false);
				console.log("Error downloading profile posts", error);
			}
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
			onPress: async () => {
			  await clearSettings();
			  // Profile can open above any iPad detail stack. Reset them all so
			  // Bookshelves takes the user through the normal sign-in flow.
			  navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
			}
		  }
		]);
	}
	  
	function clearSettings() {
		activePostsLoad.current += 1;
		clearProfilePostsCaches();
		clearBookCaches();
		return Promise.all([
			keys.authToken, keys.currentUsername, keys.currentBlogID,
			keys.currentBlogName, keys.blogCount, keys.currentBookshelf,
			keys.currentSearch, keys.currentText, keys.currentPostURL,
			keys.allBookshelves, keys.meURL, keys.authState, keys.authURL,
			keys.tokenURL, keys.micropubURL, keys.micropubToken,
			keys.lastMicropubToken, keys.appleUserID, keys.appleIdentityToken
		].map(key => epilogueStorage.remove(key)));
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

	function toggleSearch(isVisible) {
		LayoutAnimation.configureNext({
			duration: 200,
			update: { type: LayoutAnimation.Types.easeInEaseOut }
		});
		setSearching(isVisible);
		if (!isVisible) {
			setSearchText("");
		}
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
			{isSearching ? (
				<View style={[styles.micropubPane, profileSearchStyles.searchPane]}>
					<TextInput
						style={[styles.searchField, profileSearchStyles.field]}
						value={searchText}
						onChangeText={setSearchText}
						placeholder="Search posts"
						placeholderTextColor="#777777"
						accessibilityLabel="Search posts"
						autoFocus={true}
						autoCorrect={false}
						autoCapitalize="none"
						returnKeyType="done"
						clearButtonMode="while-editing"
					/>
					<Pressable
						style={profileSearchStyles.button}
						hitSlop={10}
						accessibilityRole="button"
						accessibilityLabel="Cancel post search"
						onPress={() => toggleSearch(false)}
					>
						<Text style={styles.micropubButtonTitle}>Cancel</Text>
					</Pressable>
				</View>
			) : (
				<View style={[styles.micropubPane, profileSearchStyles.controlsPane]}>
					<Text style={[styles.micropubHostname, profileSearchStyles.hostname]} numberOfLines={1}>Posting to: {hostname}</Text>
					<Pressable style={[styles.micropubButton, styles.profileMicropubButton]} onPress={() => { onChangePressed(); }}>
						<Text style={styles.micropubButtonTitle} accessibilityLabel="change posting blog">Change...</Text>
					</Pressable>
					<Pressable style={[styles.micropubButton, styles.profileMicropubButton, profileSearchStyles.buttonGap]} onPress={() => { onNotesKeyPressed(); }}>
						<Text style={styles.micropubButtonTitle} accessibilityLabel="set secret key">Notes Key...</Text>
					</Pressable>
					<Pressable
						style={[styles.micropubButton, styles.profileMicropubButton, profileSearchStyles.button, profileSearchStyles.buttonGap, !hasLoadedPosts && profileSearchStyles.disabled]}
						hitSlop={10}
						accessibilityRole="button"
						accessibilityLabel="Search posts"
						accessibilityState={{ disabled: !hasLoadedPosts }}
						disabled={!hasLoadedPosts}
						onPress={() => toggleSearch(true)}
					>
						<Icon name="discover" color={is_dark ? "#E5E7EB" : "#000000"} size={16} />
					</Pressable>
				</View>
			)}
			<AnimatedFlatList
				style={styles.profilePosts}
				contentContainerStyle={styles.profilePostsContent}
				data = {filteredPosts}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
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
				style={[
					styles.profileVersionPaneContainer,
					{
						opacity: versionPaneOpacity,
						transform: [{ translateY: versionPaneTranslateY }]
					}
				]}
			>
				<Pressable style={styles.profileVersionPane}>
					<Text style={styles.profileVersionText}>
						{appVersionLabel}
						{appBuildLabel.length > 0 ? (
							<Text style={styles.profileVersionBuildText}> {appBuildLabel}</Text>
						) : null}
					</Text>
				</Pressable>
			</Animated.View>
		</View>
	);
}

const profileSearchStyles = StyleSheet.create({
	controlsPane: {
		paddingRight: 15
	},
	hostname: {
		flexShrink: 1
	},
	button: {
		marginLeft: 12,
		alignItems: "center",
		justifyContent: "center"
	},
	disabled: {
		opacity: 0.35
	},
	buttonGap: {
		marginLeft: 10
	},
	searchPane: {
		paddingRight: 15
	},
	field: {
		flex: 1,
		marginTop: 0,
		marginBottom: 0,
		marginLeft: 0,
		marginRight: 0,
		paddingTop: 0,
		paddingBottom: 0,
		textAlignVertical: "center"
	},
	emptyText: {
		padding: 20,
		textAlign: "center"
	}
});

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
