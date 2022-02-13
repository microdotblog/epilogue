import { AsyncStorage } from "@react-native-async-storage/async-storage";

export var EpilogueStorage = {
	async set(key, value) {
		try {
			await AsyncStorage.setItem(key, value);
		}
		catch (error) {
		}
	},	
	async get(key) {
		try {
			const value = await AsyncStorage.getItem(key);
			if (value !== null) {
				console.log(value);
			}
		}
		catch (error) {
		}
	}
}