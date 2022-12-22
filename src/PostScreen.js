import React, { Component, useState } from "react";
import type { Node } from "react";
import { TextInput, ActivityIndicator, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";

export function PostScreen({ navigation }) {
	const styles = useEpilogueStyle()
	const [ text, setText ] = useState();
	const [ title, setTitle ] = useState();
	const [ blogID, setBlogID ] = useState();
	const [ blogName, setBlogName ] = useState();
	const [ progressAnimating, setProgressAnimating ] = useState(false);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		setupPostButton();
		setupFields();
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
	}
	
	function onSendPost() {
		setProgressAnimating(true);
		
		epilogueStorage.get(keys.currentText).then(current_text => {
			epilogueStorage.get(keys.currentTitle).then(current_title => {
				epilogueStorage.get("current_blog_id").then(blog_id => {
					let form = new FormData();
					form.append("h", "entry");
					form.append("name", current_title);
					form.append("content", current_text);
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
		
								fetch(use_url, options).then(response => response.json()).then(data => {
									navigation.goBack();
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
		
	return (
		<View style={styles.postTextBox}>
			<Pressable style={styles.postHostnameBar} onPress={onShowBlogs}>
				<Text style={styles.postHostnameLeft}></Text>
				<Text style={styles.postHostnameText}>{blogName}</Text>
				<ActivityIndicator style={styles.postHostnameProgress} size="small" animating={progressAnimating} />
			</Pressable>
			<PostTitleField title={title} />
			<TextInput style={styles.postTextInput} value={text} onChangeText={onChangeText} multiline={true} autoFocus={true} />
		</View>
	);
}
