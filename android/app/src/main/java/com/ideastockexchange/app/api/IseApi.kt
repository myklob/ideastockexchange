package com.ideastockexchange.app.api

import com.ideastockexchange.app.BuildConfig
import com.ideastockexchange.app.model.BeliefDetailResponse
import com.ideastockexchange.app.model.BeliefListResponse
import com.ideastockexchange.app.model.BeliefSummary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL

// Thin coroutine-based client over the deployed JSON API. Uses HttpURLConnection
// to keep dependencies minimal — the iOS counterpart (ios/Sources/Native/ISEAPI.swift)
// uses URLSession for the same reason.
class IseApi(
    private val baseUrl: String = BuildConfig.BASE_URL,
) {
    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    suspend fun fetchBeliefs(limit: Int = 200): List<BeliefSummary> = withContext(Dispatchers.IO) {
        val body = get("/api/beliefs?limit=$limit")
        json.decodeFromString<BeliefListResponse>(body).beliefs
    }

    suspend fun fetchBelief(id: Int): BeliefDetailResponse = withContext(Dispatchers.IO) {
        val body = get("/api/beliefs/$id")
        json.decodeFromString<BeliefDetailResponse>(body)
    }

    private fun get(path: String): String {
        val url = URL(baseUrl.trimEnd('/') + path)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 15_000
            readTimeout = 30_000
            setRequestProperty("Accept", "application/json")
        }
        return conn.use { c ->
            val code = c.responseCode
            if (code !in 200..299) {
                val err = runCatching { c.errorStream?.bufferedReader()?.readText() }.getOrNull()
                throw ApiException("HTTP $code for $path: ${err ?: "no body"}")
            }
            c.inputStream.bufferedReader().use { it.readText() }
        }
    }

    private inline fun <T> HttpURLConnection.use(block: (HttpURLConnection) -> T): T = try {
        block(this)
    } finally {
        disconnect()
    }
}

class ApiException(message: String) : RuntimeException(message)
