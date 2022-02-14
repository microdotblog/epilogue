import AsyncStorage from "@react-native-async-storage/async-storage";

class EpilogueStorage {
	async set(key, value) {
		try {
			var s = value;
			if (typeof s != "string") {
				s = JSON.stringify(s);
			}
			await AsyncStorage.setItem(key, s);
		}
		catch (e) {
			console.log("Error setting key: " + key);
			console.log(e);
		}
	}
		
	async get(key) {
		try {
			const value = await AsyncStorage.getItem(key);
			if (value != null) {
				try {
					// parse if it's a serialized object
					return JSON.parse(value);
				}
				catch (e) {
					// not JSON, just return it
					return value;
				}
			}
		}
		catch (e) {
			console.log("Error getting key: " + key);
			console.log(e);
		}
		
		return null;
	}
	
	async remove(key) {
		try {
			await AsyncStorage.removeItem(key);
		}
		catch (e) {
			console.log("Error deleting key: " + key);
			console.log(e);
		}
	}
}

export default new EpilogueStorage();