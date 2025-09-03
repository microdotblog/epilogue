package blog.micro.epilogue

import android.util.Base64
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import java.security.SecureRandom

class MBNotesCryptoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "MBNotesCryptoModule"

    @ReactMethod
    fun encryptText(text: String, key: String, promise: Promise) {
        try {
            val encryptedText = MBNoteCrypto.encryptText(text, key)
            promise.resolve(encryptedText)
        } catch (e: Exception) {
            promise.reject("Encrypt Error:", e)
        }
    }

    @ReactMethod
    fun decryptText(text: String, key: String, promise: Promise) {
        try {
            val decryptedText = MBNoteCrypto.decryptText(text, key)
            promise.resolve(decryptedText)
        } catch (e: Exception) {
            promise.reject("Decrypt Error:", e)
        }
    }

    private object MBNoteCrypto {

        fun encryptText(text: String, keyHex: String): String {
            val keyBytes = hexStringToByteArray(keyHex)
            val secretKey: SecretKey = SecretKeySpec(keyBytes, "AES")

            val secureRandom = SecureRandom()
            val iv = ByteArray(12) // 96 bits IV
            secureRandom.nextBytes(iv)

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val gcmParameterSpec = GCMParameterSpec(128, iv) // 128 bit auth tag length
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmParameterSpec)

            val encryptedData = cipher.doFinal(text.toByteArray(Charsets.UTF_8))

            val combined = ByteArray(iv.size + encryptedData.size)
            System.arraycopy(iv, 0, combined, 0, iv.size)
            System.arraycopy(encryptedData, 0, combined, iv.size, encryptedData.size)

            return Base64.encodeToString(combined, Base64.NO_WRAP)
        }

        fun decryptText(encryptedText: String, keyHex: String): String {
            val keyBytes = hexStringToByteArray(keyHex)
            val secretKey: SecretKey = SecretKeySpec(keyBytes, "AES")

            val encryptedBytes = Base64.decode(encryptedText, Base64.DEFAULT)
            val iv = encryptedBytes.copyOfRange(0, 12)
            val ciphertext = encryptedBytes.copyOfRange(12, encryptedBytes.size)

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val gcmParameterSpec = GCMParameterSpec(128, iv) // 128 bit auth tag length
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmParameterSpec)

            val decryptedBytes = cipher.doFinal(ciphertext)
            return String(decryptedBytes, Charsets.UTF_8)
        }

        private fun hexStringToByteArray(s: String): ByteArray {
            val len = s.length
            val data = ByteArray(len / 2)
            var i = 0
            while (i < len) {
                data[i / 2] = ((Character.digit(s[i], 16) shl 4) + Character.digit(s[i + 1], 16)).toByte()
                i += 2
            }
            return data
        }
    }
}