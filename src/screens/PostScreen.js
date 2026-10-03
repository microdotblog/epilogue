import React, { Component, useRef, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable, Text, View, FlatList, useWindowDimensions, Dimensions, useColorScheme } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import FastImage from "react-native-fast-image";

import { keys } from "../Constants";
import { BOOK_COVER_HEIGHT, BOOK_COVER_WIDTH } from "../Styles";
import { useEpilogueStyle } from '../hooks/useEpilogueStyle';
import epilogueStorage from "../Storage";
import { Icon } from "../Icon";
import { deleteProfilePostsCache } from "../ProfilePostsCache";
import HighlightingText from "../components/text/highlighting_text";

export function PostScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const colorScheme = useColorScheme();
	const windowSize = useWindowDimensions();
	const headerHeight = useHeaderHeight();
	const editorRef = useRef();
	const didLoadText = useRef(false);
	const postSending = useRef(false);
	const [ editorActive, setEditorActive ] = useState(navigation.isFocused?.() !== false);
	const calendarMode = route.params?.calendarMode === true;
	const calendarPage = route.params?.calendarPage;
	const initialCalendarText = calendarPage ? calendarPage.content : '{{< bookcalendar view="list" >}}';
	const [ text, setText ] = useState(calendarMode ? initialCalendarText : undefined);
	const calendarText = useRef(initialCalendarText);
	const calendarSending = useRef(false);
	const [ title, setTitle ] = useState(calendarMode ? (calendarPage?.title || "Book calendar") : undefined);
	const [ calendarKeyboardHeight, setCalendarKeyboardHeight ] = useState(0);
	const [ blogID, setBlogID ] = useState(calendarMode ? (route.params.calendarBlogID || "") : undefined);
	const [ blogName, setBlogName ] = useState(calendarMode ? (route.params.calendarBlogName || "Micro.blog") : undefined);
	const [ blogCount, setBlogCount ] = useState(0);
	const [ postURL, setPostURL ] = useState();
	const [ progressAnimating, setProgressAnimating ] = useState(false);
	const { books } = route.params;
	const [ bookColumns, setBookColumns ] = useState(bestColumnsForWidth(windowSize.width))
	const showsPostNotice = (title != undefined) && (title.length > 0);
	const showsPlainPostSpacer = !showsPostNotice;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			setEditorActive(true);
			onFocus(navigation);
			editorRef.current?.focus();
		});
		const blur = navigation.addListener("blur", () => setEditorActive(false));
		const transitionEnd = navigation.addListener("transitionEnd", ({ data }) => {
			if (!data.closing && navigation.isFocused?.() !== false) editorRef.current?.focus();
		});
		if (navigation.isFocused?.()) onFocus(navigation);
		return () => { unsubscribe(); blur(); transitionEnd(); };
	}, [navigation]);	

	React.useEffect(() => {
		const subscription = Dimensions.addEventListener("change", ({screen}) => {
			setBookColumns(bestColumnsForWidth(Dimensions.get("window").width));
		});
		return () => subscription?.remove()
	}, []);

	React.useEffect(() => {
		if (!calendarMode || Platform.OS !== "ios") return;
		const frameSubscription = Keyboard.addListener("keyboardWillChangeFrame", (event) => {
			setCalendarKeyboardHeight(event.endCoordinates.height);
		});
		const hideSubscription = Keyboard.addListener("keyboardWillHide", () => setCalendarKeyboardHeight(0));
		return () => {
			frameSubscription.remove();
			hideSubscription.remove();
		};
	}, [calendarMode]);

	function onFocus(navigation) {
		if (calendarMode) setupCalendarPageButton();
		else {
			setupPostButton();
			setupFields();
		}
	}
	
	function bestColumnsForWidth(width) {
		let inset = 14;
		let cover_width = 50;
		let spacing = 5 * 2;
		let adjusted_width = width - (inset * 2);
		
		var cols = Math.floor(adjusted_width / (cover_width + spacing));
		if (cols < 3) {
			cols = 3;
		}
			
		return cols;
	}

	function onShowBlogs() {
		if (!calendarMode) navigation.navigate("Blogs");
	}
		
	function onChangeText(text) {
		setText(text);
		if (calendarMode) calendarText.current = text;
		else epilogueStorage.set(keys.currentText, text);
	}

	function setupPostButton() {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onSendPost(); }}>
				<Text style={styles.navbarSubmit}>Post</Text>
			  </Pressable>
			)
		});		
	}

	function setupUpdateButton() {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onSendPost(); }}>
				<Text style={styles.navbarSubmit}>Update</Text>
			  </Pressable>
			)
		});		
	}

	function setupCalendarPageButton() {
		navigation.setOptions({
			headerRight: () => (
				<Pressable onPress={onSendCalendarPage} accessibilityRole="button" accessibilityLabel={calendarPage ? "Update Page" : "Add Page"}>
					<Text style={styles.navbarSubmit}>{calendarPage ? "Update Page" : "Add Page"}</Text>
				</Pressable>
			)
		});
	}

	async function onSendCalendarPage() {
		if (calendarSending.current) return;
		calendarSending.current = true;
		try {
			calendarText.current = await editorRef.current.getText();
			setText(calendarText.current);
			setProgressAnimating(true);
			const token = await epilogueStorage.get(keys.authToken);
			if (!token) throw new Error("Missing sign-in token");
			let options;
			if (calendarPage) {
				const fields = {
					action: "update",
					url: calendarPage.url,
					"mp-channel": "pages",
					replace: { content: calendarText.current }
				};
				if (blogID) fields["mp-destination"] = blogID;
				options = {
					method: "POST",
					headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
					body: JSON.stringify(fields)
				};
			} else {
				const form = new FormData();
				form.append("h", "entry");
				form.append("mp-channel", "pages");
				form.append("name", "Book calendar");
				form.append("content", calendarText.current);
				if (blogID) form.append("mp-destination", blogID);
				options = { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form };
			}
			const response = await fetch("https://micro.blog/micropub", options);
			if (!response.ok) throw new Error("Could not save book calendar page");
			navigation.goBack();
		} catch {
			calendarSending.current = false;
			setProgressAnimating(false);
			Alert.alert("Couldn’t save page", "Please try again.");
		}
	}
	
	function setupFields() {
		// Returning from Blogs must not replace the live editor text or its selection.
		if (!didLoadText.current) {
			didLoadText.current = true;
			epilogueStorage.get(keys.currentText).then(current_text => setText(current_text || ""));
		}

		epilogueStorage.get(keys.currentTitle).then(current_title => {
			if (current_title != null) {
				setTitle(current_title);
			}
		});
		
		epilogueStorage.get(keys.currentBlogName).then(blog_name => {
			if ((blog_name != undefined) && (blog_name.length > 0)) {
				setBlogName(blog_name);
			}
			else {
				epilogueStorage.get(keys.micropubURL).then(micropub_url => {
					let pieces = micropub_url.split("/");
					let hostname = pieces[2];
					setBlogName(hostname);
				});				
			}
		});
		
		epilogueStorage.get(keys.currentBlogID).then(blog_id => {
			setBlogID(blog_id);
		});

		epilogueStorage.get(keys.blogCount).then(blog_count => {
			setBlogCount(blog_count || 0);
		});

		epilogueStorage.get(keys.currentPostURL).then(post_url => {
			if (post_url != undefined) {
				setPostURL(post_url);
				setupUpdateButton();
			}
		});
	}
	
	async function onSendPost() {
		if (postSending.current) return;
		postSending.current = true;
		try {
			const currentText = await editorRef.current.getText();
			setText(currentText);
			await epilogueStorage.set(keys.currentText, currentText);
			setProgressAnimating(true);
		} catch {
			postSending.current = false;
			Alert.alert("Couldn’t read post", "Please try again.");
			return;
		}
		
		epilogueStorage.get(keys.currentText).then(current_text => {
			epilogueStorage.get(keys.currentTitle).then(current_title => {
				epilogueStorage.get(keys.currentTextExtra).then(current_extra => {
					epilogueStorage.get(keys.currentBlogID).then(blog_id => {
						epilogueStorage.get(keys.currentPostURL).then(post_url => {
							var options = {};
							
							epilogueStorage.get("auth_token").then(auth_token => {
								var use_token = auth_token;
								epilogueStorage.get(keys.micropubToken).then(micropub_token => {
									if (micropub_token != undefined) {
										use_token = micropub_token;
									}

									// if we're editing a post, need to send as JSON
									if (post_url != undefined) {
										var fields = {
											action: "update",
											url: post_url,
											replace: {
												content: current_text
											}
										};

										if (blog_id.length > 0) {
											fields["mp-destination"] = blog_id;
										}
									
										options = {
											method: "POST",
											headers: {
												"Authorization": "Bearer " + use_token,
												"Content-Type": "application/json"
											},
											body: JSON.stringify(fields)
										};
									}
									else {
										// new posts go as form-encoded
										let form = new FormData();
										form.append("h", "entry");							
										if (current_title != undefined) {
											form.append("name", current_title);
										}
									
										if (current_extra != undefined) {
											form.append("content", current_text + current_extra);
										}
										else {
											form.append("content", current_text);
										}
									
										if (blog_id.length > 0) {
											form.append("mp-destination", blog_id);
										}

										options = {
											method: "POST",
											body: form,
											headers: {
												"Authorization": "Bearer " + use_token
											}
										};
									}
								
									// setProgressAnimating(true);
								
									epilogueStorage.get(keys.micropubURL).then(micropub_url => {
										var use_url = micropub_url;
										if (use_url == undefined) {
											use_url = "https://micro.blog/micropub";
										}
										
										if ((current_extra != undefined) && current_extra.includes("{{< bookgoals") && !use_url.includes("https://micro.blog")) {
											// posting book goals only works with Micro.blog
											alert("Posting your reading goals is only supported on Micro.blog-hosted blogs.");
											navigation.goBack();
										}
										else {
											fetch(use_url, options).then(async response => {
												if (response.ok && post_url != undefined) {
													// An edited older post may fall outside the next incremental refresh.
													const username = await epilogueStorage.get(keys.currentUsername);
													await deleteProfilePostsCache([username || "", use_url, blog_id || ""]);
												}
												navigation.goBack();
											});
										}
									});
								});
							});
						});
					});
				});
			});
		});
	}

	class PostTitleField extends Component {
		constructor(props) {
			super(props);
			this.title = props.title;
		}
	
		render() {
			if ((this.title != undefined) && (this.title.length > 0)) {
				return (
					<Text style={styles.postTitleField}>{this.title}</Text>
				);
			}
			else {
				return (
					<View />					
				);
			}
		}
	}

	class PostNoticeField extends Component {
		constructor(props) {
			super(props);
			this.title = props.title;
			this.notice = props.notice;
		}
				
		render() {
			// we're just going to use title to know whether to show the notice text
			if ((this.title != undefined) && (this.title.length > 0)) {
				return (
					<Text style={styles.postTextNotice}>{this.notice || 'Publishing this post will also install the Micro.blog plug-in "Book reading goals" on your blog.'}</Text>
				);
			}
			else {
				return (
					<View />					
				);
			}
		}
	}
	
	class PostBooksGrid extends Component {
		constructor(props) {
			super(props);

			this.title = props.title;
			this.data = props.books;
			this.columns = props.columns;
		}

		renderItem({item}) {
			let cover_url = "https://micro.blog/books/" + item.isbn + "/cover.jpg";
			return (
				<FastImage style={{width: BOOK_COVER_WIDTH, height: BOOK_COVER_HEIGHT, marginLeft: 5, marginRight: 5, marginBottom: 10}} source={{
					uri: cover_url
				}}/>
			)
		}
		
		render() {
			// we're just going to use title to know whether to show the book list
			if ((this.title != undefined) && (this.title.length > 0)) {
				return (
					<View style={styles.postBooksContainer}>
						<FlatList
							data={this.data}
							key={this.columns}
							keyExtractor={(item) => item.id.toString()}
							numColumns={this.columns}
							renderItem={this.renderItem}
						/>
					</View>
				);
			}
			else {
				return (
					<View />					
				);
			}
		}
	}
		
	return (
		<KeyboardAvoidingView
			style={[styles.postTextBox, calendarMode && Platform.OS === "ios" && { paddingBottom: calendarKeyboardHeight }]}
			behavior={Platform.OS === "ios" && !calendarMode ? "padding" : undefined}
			keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
		>
			{calendarMode && Platform.OS === "ios" && calendarKeyboardHeight > 0 && (
				<View pointerEvents="none" style={[styles.postTextNotice, {
					position: "absolute", bottom: 0, left: 0, right: 0,
					height: calendarKeyboardHeight, borderTopWidth: 0
				}]} />
			)}
			<Pressable style={styles.postHostnameBar} onPress={onShowBlogs} disabled={calendarMode}>
				<Text style={styles.postHostnameLeft}></Text>
				<View style={styles.postHostnameCenter}>
					<Text style={styles.postHostnameText}>{blogName}</Text>
					{ !calendarMode && blogCount > 1 ? (
						<Icon name="popup-triangle" color="#777777" size={10} style={styles.postHostnameChevron} />
					) : null }
				</View>
				<ActivityIndicator style={styles.postHostnameProgress} size="small" animating={progressAnimating} />
			</Pressable>
			<PostTitleField title={title} />

			{ text !== undefined && <HighlightingText
				ref={editorRef}
				style={[styles.postTextInput, styles.postEditorTextInput]}
				value={text}
				onChangeText={onChangeText}
				autoFocus={editorActive}
				editable={editorActive && !progressAnimating}
				colorScheme={colorScheme}
				fontScale={windowSize.fontScale}
				scrollEnabled={true}
			/> }
			<PostNoticeField title={title} notice={calendarMode ? "Share the book calendar on your blog." : undefined} />

			{showsPlainPostSpacer && (
				<View style={styles.postEditorBottomSpacer} />
			)}
			
			{!calendarMode && <PostBooksGrid title={title} books={books} columns={bookColumns} />}
		</KeyboardAvoidingView>
	);
}
