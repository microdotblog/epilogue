import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

var editing_date = new Date();
var editing_time = new Date();

export function DateScreen({ route, navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const styles = useEpilogueStyle();
	const { id, bookshelf_id, isbn, date_finished } = route.params;

	var d = new Date();
	if (date_finished.length > 0) {
		d = new Date(date_finished);
	}
	editing_date = d;
	editing_time = d;
	 
	const [ date, setDate ] = useState(d);
	const [ time, setTime ] = useState(d);
	const [ isUploading, setIsUploading ] = useState(false);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	

	function setupUpdateButton() {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onUpdate(); }}>
				  <Text style={styles.navbarSubmit}>Update</Text>
			  </Pressable>
			)
		});		
	}
	
	function onFocus() {
		setupUpdateButton();
	}
	
	const onChangeDate = (event, selectedDate) => {
		editing_date = selectedDate;
	};

	const onChangeTime = (event, selectedTime) => {
		let d1 = new Date(selectedTime);
		let d2 = new Date(date_finished);
		if (d1.getTime() != d2.getTime()) {
			editing_time = selectedTime;
		}
	};
	
	function onUpdate() {
		setIsUploading(true);

		// combine date/time pickers and convert to GMT
		const combined_date = combineDateAndTime(editing_date, editing_time);
		const offset_minutes = combined_date.getTimezoneOffset();
		const offset_ms = offset_minutes * 60 * 1000;
		const combined_gmt = new Date(combined_date.getTime() + offset_ms);
		
		epilogueStorage.get("auth_token").then(auth_token => {
			let form = new FormData();
			form.append("date_finished", combined_gmt.toString());
				
			var options = {
				method: "POST",
				body: form,
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
					
			let url = `https://micro.blog/books/bookshelves/${bookshelf_id}/save/${id}`;
			fetch(url, options).then(response => response.json()).then(data => {
				navigation.goBack();
			});
		});
	}

	function combineDateAndTime(date, time) {
		// date components
		const year = date.getFullYear();
		const month = date.getMonth();
		const day = date.getDate();
	
		// time components
		const hours = time.getHours();
		const minutes = time.getMinutes();
		const seconds = time.getSeconds();
		const ms = time.getMilliseconds();
	
		// new date with combined components
		return new Date(year, month, day, hours, minutes, seconds, ms);
	}	
	
	return (
		<View style={styles.container}>
			<View style={styles.finishedDatePicker}>
				<DateTimePicker				
					testID="datePicker"
					value={date}
					mode="date"
					display="inline"
					onChange={onChangeDate}
				/>
			</View>
			<View style={styles.finishedTimePickerRow}>
				<DateTimePicker
					testID="timePicker"
					value={time}
					mode="time"
					onChange={onChangeTime}
				/>
				<ActivityIndicator style={styles.finishedProgress} size="small" animating={isUploading} />
			</View>
		</View>
	)
}