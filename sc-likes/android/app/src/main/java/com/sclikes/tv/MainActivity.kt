package com.sclikes.tv

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.util.Base64
import android.view.KeyEvent
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        web = WebView(this)
        setContentView(web)
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/app/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false   // lets the SoundCloud widget autoplay
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true)
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest) =
                loader.shouldInterceptRequest(request.url)
        }
        web.addJavascriptInterface(Bridge(), "Android")
        web.requestFocus()
        web.loadUrl("https://appassets.androidplatform.net/app/index.html")
    }

    /** Remote's media keys -> player buttons in the web UI. */
    override fun dispatchKeyEvent(e: KeyEvent): Boolean {
        if (e.action == KeyEvent.ACTION_DOWN) {
            val k = when (e.keyCode) {
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_MEDIA_PLAY, KeyEvent.KEYCODE_MEDIA_PAUSE -> "toggle"
                KeyEvent.KEYCODE_MEDIA_NEXT, KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> "next"
                KeyEvent.KEYCODE_MEDIA_PREVIOUS, KeyEvent.KEYCODE_MEDIA_REWIND -> "prev"
                else -> null
            }
            if (k != null) { web.evaluateJavascript("window.tvKey&&window.tvKey('$k')", null); return true }
        }
        return super.dispatchKeyEvent(e)
    }

    /** Does SoundCloud HTTP requests natively, so the web app needs no server and has no CORS limits. */
    inner class Bridge {
        private val pool = Executors.newFixedThreadPool(4)

        @JavascriptInterface
        fun config(): String = try { assets.open("credentials.txt").bufferedReader().readText() } catch (e: Exception) { "" }

        @JavascriptInterface
        fun fetch(id: Int, method: String, url: String, headers: String, body: String) {
            pool.execute {
                var status = 0
                var hdrs = "{}"
                var b64 = ""
                try {
                    val u = URL(url)
                    val ok = u.protocol == "https" && (u.host == "soundcloud.com" || u.host.endsWith(".soundcloud.com") || u.host.endsWith(".sndcdn.com"))
                    require(ok) { "host not allowed" }
                    val c = u.openConnection() as HttpURLConnection
                    c.requestMethod = method
                    c.instanceFollowRedirects = false
                    c.connectTimeout = 15000
                    c.readTimeout = 30000
                    val h = JSONObject(headers)
                    for (k in h.keys()) c.setRequestProperty(k, h.getString(k))
                    if (body.isNotEmpty()) { c.doOutput = true; c.outputStream.use { it.write(body.toByteArray()) } }
                    status = c.responseCode
                    val bytes = (if (status >= 400) c.errorStream else c.inputStream)?.use { it.readBytes() } ?: ByteArray(0)
                    val o = JSONObject()
                    for ((k, v) in c.headerFields) if (k != null && v.isNotEmpty()) o.put(k.lowercase(), v[0])
                    hdrs = o.toString()
                    b64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                } catch (e: Exception) {
                    status = 0
                }
                val js = "window.__nf($id,$status,${JSONObject.quote(hdrs)},'$b64')"
                runOnUiThread { web.evaluateJavascript(js, null) }
            }
        }
    }
}
