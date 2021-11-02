package blog.micro.epilogue

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

//        WebView.setWebContentsDebuggingEnabled(true);

        setContentView(R.layout.activity_main)

        val webview = findViewById<WebView>(R.id.webview)
        webview.webViewClient = this.webclient
        webview.loadUrl("file:///android_asset/signin.html")

        val settings = webview.settings
        settings.javaScriptEnabled = true

//        Intent intent = getIntent()
//        if (Intent.ACTION_VIEW.equals(intent.getAction())) {
//            Uri uri = intent.getData()
//        }
    }

    override fun onBackPressed() {
        super.onBackPressed()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
    }

}

private class EpilogueWebClient : WebViewClient() {

    var token = ""
    var isLoaded = false

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
            if (this.token.length > 0) {
                this.isLoaded = true
                var s = "javascript:document.epilogueToken = \"" + this.token + "\"; checkToken();"
                view.loadUrl(s)
            }
        }
    }

    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
        print(error)
    }

    fun handleEpilogueURI(uri: Uri, webview: WebView): Boolean {
        if (uri.host == "signin") {
            this.token = uri.path?.split("/")?.last() as String
            webview.loadUrl("file:///android_asset/index.html")
            return true
        }
        else if (uri.host == "signout") {
            this.token = ""
            this.isLoaded = false
            webview.loadUrl("file:///android_asset/signin.html")
            return true
        }

        return false
    }

}