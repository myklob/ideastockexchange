package com.ideastockexchange.app.ui.web

import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.ideastockexchange.app.BuildConfig

@Composable
@SuppressLint("SetJavaScriptEnabled")
fun WebScreen(modifier: Modifier = Modifier) {
    val initialUrl = remember { BuildConfig.BASE_URL }
    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                webViewClient = WebViewClient()
                loadUrl(initialUrl)
            }
        },
    )
}
