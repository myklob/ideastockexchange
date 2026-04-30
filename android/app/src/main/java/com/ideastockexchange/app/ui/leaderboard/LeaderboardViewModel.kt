package com.ideastockexchange.app.ui.leaderboard

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.ideastockexchange.app.api.IseApi
import com.ideastockexchange.app.data.Leaderboard
import com.ideastockexchange.app.data.LeaderboardEntry
import com.ideastockexchange.app.data.PortfolioStore
import com.ideastockexchange.app.model.equity
import com.ideastockexchange.app.model.priceFromScore
import kotlinx.coroutines.launch

class LeaderboardViewModel(
    application: Application,
) : AndroidViewModel(application) {

    private val api: IseApi = IseApi()
    private val store = PortfolioStore.get(application)
    private val marks = mutableStateMapOf<Int, Double>()

    var refreshing by mutableStateOf(false)
        private set
    var entries: List<LeaderboardEntry> by mutableStateOf(buildEntries())
        private set

    init {
        refresh()
        viewModelScope.launch {
            store.state.collect { entries = buildEntries() }
        }
    }

    fun refresh() {
        if (refreshing) return
        refreshing = true
        viewModelScope.launch {
            val ids = store.state.value.positions.map { it.beliefId }.toSet()
            ids.forEach { id ->
                try {
                    val r = api.fetchBelief(id)
                    val price = priceFromScore(r.scores.strengthAdjustedScore, r.scores.overallScore)
                    if (price != null) marks[id] = price
                } catch (_: Throwable) {
                    // keep prior mark; one failed fetch shouldn't blank the leaderboard.
                }
            }
            entries = buildEntries()
            refreshing = false
        }
    }

    private fun buildEntries(): List<LeaderboardEntry> {
        val portfolio = store.state.value
        val net = portfolio.equity(marks.toMap())
        return Leaderboard.build(currentUserNetWorth = net)
    }
}
