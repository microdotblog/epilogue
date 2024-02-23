import React, { useState, useRef } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

export function DateScreen({ route, navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const styles = useEpilogueStyle();
	const [ date, setDate ] = useState(new Date());
	const [ time, setTime ] = useState(new Date());
	
	const onChangeDate = (event, selectedDate) => {
		console.log("date", selectedDate);
	};

	const onChangeTime = (event, selectedTime) => {
		console.log("time", selectedTime);
	};
	
	return (
		<View>
			<View style={styles.finishedDatePicker}>
				<DateTimePicker				
					testID="datePicker"
					value={date}
					mode="date"
					display="inline"
					onChange={onChangeDate}
				/>
			</View>
			<View style={styles.finishedTimePicker}>
				<DateTimePicker
					testID="timePicker"
					value={time}
					mode="time"
					display="inline"
					onChange={onChangeTime}
				/>
			</View>
		</View>
	)
}