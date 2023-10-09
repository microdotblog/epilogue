import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Image, StyleSheet, Text, View, useColorScheme } from "react-native";
import FastImage from "react-native-fast-image";
import { launchImageLibrary } from "react-native-image-picker";
import RNFS from "react-native-fs";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Book } from "../Book";
import { Icon } from "../Icon";

export function OpenDetailsScreen({ route, navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const styles = useEpilogueStyle();
	const [ isUploading, setIsUploading ] = useState(false);
	const { title, isbn, image, work_key, edition_key } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	const onFocus = (navigation) =>  {
		console.log("Edition key", edition_key)
	}
	
	function onPromptNewCover() {
		let picker_options = {
			mediaType: "photo",
			selectionLimit: 0
		};
		launchImageLibrary(picker_options, (result) => {
			if (result.error) {
				console.log("Error choosing photo", result.error);
			}
			else if (result.assets != undefined) {
				let picked_photo = result.assets[0];

				// copy to new temporary location
				let new_folder = RNFS.TemporaryDirectoryPath;
				let new_filename = Math.floor(Math.random() * 1000) + "-" + picked_photo.fileName;
				let new_path = new_folder + "/" + new_filename;
				RNFS.copyFile(picked_photo.uri, new_path).then(() => {					
					// upload file data
					let form = new FormData();
					form.append("file", {
						name: picked_photo.fileName,
						type: picked_photo.type,
						uri: new_path
					});
					
					setIsUploading(true);
					
					epilogueStorage.get(keys.openLibrarySession).then(saved_session => {
						let url = `https://openlibrary.org/books/${edition_key}/Title/add-cover`;
						let options = {
							method: "POST",
							body: form,
							headers: {
								"Cookie": "session=" + saved_session
							}
						};
											
						fetch(url, options).then(response => {							
							RNFS.unlink(new_path);
							setIsUploading(false);
						});
					});
				})
				.catch((e) => {
					console.log("Error copying temp file", e);
				});
			}
		});
	}
	
	return (
		<View style={[styles.container, styles.openLibraryEditionsScreen]}>
			{ isUploading &&
				<View style={styles.openLibraryEditionsBar}>
					<Text style={styles.openLibraryEditionsTitle}>Uploading cover...</Text>
					<ActivityIndicator style={styles.openLibraryEditionsProgress} size="small" animating={isUploading} />
				</View>
			}
			{ !isUploading &&
				<View style={styles.openLibraryEditionsBar}>
					<Text style={styles.openLibraryEditionsTitle}>{title}</Text>
					<Text style={styles.openLibraryEditionsExtras}>{isbn}</Text>
					<ActivityIndicator size="small" animating={isUploading} />
				</View>
			}
			<View style={styles.openLibraryEditionsDetails}>
				<FastImage style={styles.openLibraryEditionsCover} source={{ uri: image.replace("http://", "https://") }} />
				<Pressable style={styles.openLibraryEditionsButton} onPress={() => { onPromptNewCover(); }}>
					<Icon name="photo" size={16} color={is_dark ? "#FFFFFF" : "#337AB7"} style={styles.goalsBannerIcon} />
					<Text style={styles.openLibraryEditionsButtonTitle}>New Cover...</Text>
				</Pressable>
			</View>
		</View>
	);
}