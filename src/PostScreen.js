import React, { Component, useState } from "react";
import type { Node } from "react";
import { InputAccessoryView, TextInput, ActivityIndicator, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View, FlatList, useWindowDimensions, Dimensions } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import FastImage from "react-native-fast-image";

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";

export function PostScreen({ route, navigation }) {
	const styles = useEpilogueStyle();
	const windowSize = useWindowDimensions();
	const keyboardNoticeID = "KeyboardNoticeID";
	const [ text, setText ] = useState();
	const [ title, setTitle ] = useState();
	const [ blogID, setBlogID ] = useState();
	const [ blogName, setBlogName ] = useState();
	const [ progressAnimating, setProgressAnimating ] = useState(false);
	const { books } = route.params;
	const [ bookColumns, setBookColumns ] = useState(bestColumnsForWidth(windowSize.width))

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	

	React.useEffect(() => {
		const subscription = Dimensions.addEventListener("change", ({screen}) => {
			setBookColumns(bestColumnsForWidth(Dimensions.get("window").width));
		});
		return () => subscription?.remove()
	})
	
	function onFocus(navigation) {
		setupPostButton();
		setupFields();
	}
	
	function bestColumnsForWidth(width) {
		console.log("width " + width);
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
		navigation.navigate("Blogs");
	}
		
	function onChangeText(text) {
		setText(text);
		epilogueStorage.set(keys.currentText, text);
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
	
	function setupFields() {
		epilogueStorage.get(keys.currentText).then(current_text => {
			if (current_text != null) {
				setText(current_text);
			}
		});

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
		
		// setBooks([
		// 	{
		// 		id: 123,
		// 		isbn: "9780553573398"
		// 	}
		// ]);
	}
	
	function onSendPost() {
		setProgressAnimating(true);
		
		epilogueStorage.get(keys.currentText).then(current_text => {
			epilogueStorage.get(keys.currentTitle).then(current_title => {
				epilogueStorage.get(keys.currentTitleExtra).then(current_extra => {
					epilogueStorage.get(keys.currentBlogID).then(blog_id => {
						let form = new FormData();
						form.append("h", "entry");
						if (current_title != undefined) {
							form.append("name", current_title);
						}
						form.append("content", current_text + current_extra);
						if (blog_id.length > 0) {
							form.append("mp-destination", blog_id);
						}
										
						epilogueStorage.get("auth_token").then(auth_token => {
							var use_token = auth_token;
							epilogueStorage.get(keys.micropubToken).then(micropub_token => {
								if (micropub_token != undefined) {
									use_token = micropub_token;
								}
								
								var options = {
									method: "POST",
									body: form,
									headers: {
										"Authorization": "Bearer " + use_token
									}
								};
							
								// setProgressAnimating(true);
							
								epilogueStorage.get(keys.micropubURL).then(micropub_url => {
									var use_url = micropub_url;
									if (use_url == undefined) {
										use_url = "https://micro.blog/micropub";
									}
									
									if (current_extra.includes("{{< bookgoals") && !use_url.includes("https://micro.blog")) {
										// posting book goals only works with Micro.blog
										alert("Posting your reading goals is only supported on Micro.blog-hosted blogs.");
										navigation.goBack();
									}
									else {
										fetch(use_url, options).then(response => response.json()).then(data => {
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
		}
				
		render() {
			// we're just going to use title to know whether to show the notice text
			if ((this.title != undefined) && (this.title.length > 0)) {
				return (
					<Text style={styles.postTextNotice}>Publishing this post will also install the Micro.blog plug-in "Book reading goals" on your blog.</Text>
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
				<FastImage style={{width: 50, height: 70, marginLeft: 5, marginRight: 5, marginBottom: 10}} source={{ 
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
		<View style={styles.postTextBox}>
			<Pressable style={styles.postHostnameBar} onPress={onShowBlogs}>
				<Text style={styles.postHostnameLeft}></Text>
				<Text style={styles.postHostnameText}>{blogName}</Text>
				<ActivityIndicator style={styles.postHostnameProgress} size="small" animating={progressAnimating} />
			</Pressable>
			<PostTitleField title={title} />

			{Platform.OS === "ios" && <>
				<TextInput style={styles.postTextInput} value={text} onChangeText={onChangeText} multiline={true} autoFocus={true} inputAccessoryViewID={keyboardNoticeID} />
				<InputAccessoryView nativeID={keyboardNoticeID}>
					<PostNoticeField title={title} />
				</InputAccessoryView>
			</>}
			{Platform.OS === "android" && <>
				<TextInput style={styles.postTextInput} value={text} onChangeText={onChangeText} multiline={true} autoFocus={true} />
				<PostNoticeField title={title} />
			</>}
			
			<PostBooksGrid title={title} books={books} columns={bookColumns} />
		</View>
	);
}
