import { NativeModules } from 'react-native';
const { MBNotesCryptoModule } = NativeModules;

class CryptoUtils {

  static async decrypt(text, secretToken) {
    const keyHex = secretToken.startsWith("mkey") ? secretToken.substring(4) : secretToken

    if (keyHex.length !== 64) {
      throw new Error("Invalid key length. Key must be a 64 character hex string after removing prefix.")
    }

    try {
      const result = await MBNotesCryptoModule.decryptText(text, keyHex)
      return result
    }
    catch (error) {
      throw new Error(`Decryption failed: ${error.message}`)
    }
  }

  static async encrypt(text, secretToken) {
    const keyHex = secretToken.startsWith('mkey') ? secretToken.substring(4) : secretToken

    if (keyHex.length !== 64) {
      throw new Error('Invalid key length. Key must be a 64 character hex string after removing prefix.')
    }

    try {
      let result = await MBNotesCryptoModule.encryptText(text, keyHex)
      return result
    }
    catch (error) {
      throw new Error(`Encryption failed: ${error.message}`)
    }
  }

}

export default CryptoUtils
