package blog.micro.epilogue

import android.content.Context
import android.content.SharedPreferences
import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceError
import android.net.Uri

class MainActivity : AppCompatActivity() {

    private var webclient = EpilogueWebClient()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WebView.setWebContentsDebuggingEnabled(true);

        setContentView(R.layout.activity_main)
        this.webclient.context = this

        val webview = findViewById<WebView>(R.id.webview)
        webview.webViewClient = this.webclient

        if (this.webclient.hasSavedToken()) {
            webview.loadUrl("file:///android_asset/index.html")
        }
        else {
            webview.loadUrl("file:///android_asset/signin.html")
        }

        val settings = webview.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true

        var intent = getIntent()
        this.handleIntent(intent, webview)
    }

    override fun onBackPressed() {
        super.onBackPressed()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)

        val webview = findViewById<WebView>(R.id.webview)
        intent?.also { intent ->
            this.handleIntent(intent, webview)
        }
    }

    fun handleIntent(intent: Intent, webview: WebView) {
        if (intent.action == Intent.ACTION_VIEW) {
            var uri = intent.getData()
            uri?.also { uri ->
                this.webclient.handleEpilogueURI(uri, webview)
            }
        }
    }

}

private class EpilogueWebClient : WebViewClient() {

    var token = ""
    var isLoaded = false
    var context: Context? = null
    var prefsFilename = "epilogue_prefs"

    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
        var uri = Uri.parse(url)
        if (uri.scheme == "epilogue") {
            view?.also { webview ->
                return this.handleEpilogueURI(uri, webview)
            }
        }

        return false
    }

    override fun onPageFinished(view: WebView, url: String) {
        if (!this.isLoaded) {
            if (this.token.length == 0) {
                this.token = getSavedToken()
            }

            if (this.token.length > 0) {
                if (url.contains("index.html")) {
                    this.isLoaded = true
                    var s = "checkToken(\"" + this.token + "\");"
                    view.evaluateJavascript(s, null)
                }
            }
        }
    }

    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
        print(error)
    }

    private fun saveToken() {
        var token = this.token
        this.context?.also { context ->
            val prefs = context.getSharedPreferences(prefsFilename, Context.MODE_PRIVATE)
            var editor = prefs.edit()
            editor.putString("token", token)
            editor.apply()
            editor.commit()
        }
    }

    private fun getSavedToken(): String {
        this.context?.also { context ->
            val prefs = context.getSharedPreferences(prefsFilename, Context.MODE_PRIVATE)
            var s = prefs.getString("token", "")
            if (s != null) {
                return s
            }
        }

        return ""
    }

    public fun hasSavedToken(): Boolean {
        var s = getSavedToken()
        return (s.length > 0)
    }

    fun handleEpilogueURI(uri: Uri, webview: WebView): Boolean {
        if (uri.host == "signin") {
            this.token = uri.path?.split("/")?.last() as String
            saveToken()
            this.isLoaded = false
            webview.loadUrl("file:///android_asset/index.html")
            return true
        }
        else if (uri.host == "signout") {
            this.token = ""
            this.isLoaded = false
            saveToken()
            webview.loadUrl("file:///android_asset/signin.html")
            return true
        }

        return false
    }

}