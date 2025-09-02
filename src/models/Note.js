import CryptoUtils from '../utils/crypto';
import { keys } from "../Constants";
import epilogueStorage from "../Storage";

export class Note {	
	constructor() {
		this.id = "";
		this.text = "";
	}

	static async hasSecretKey() {
		try {
			const secretKey = await epilogueStorage.get(keys.notesKey);
			return (secretKey != null && String(secretKey).trim().length > 0);
		}
		catch (e) {
			return false;
		}
	}
}
