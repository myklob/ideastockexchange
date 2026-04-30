package com.ideastockexchange.app.ui.portfolio

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.ideastockexchange.app.api.IseApi
import com.ideastockexchange.app.data.PortfolioStore
import com.ideastockexchange.app.model.Portfolio
import com.ideastockexchange.app.model.Position
import com.ideastockexchange.app.model.equity
import com.ideastockexchange.app.model.priceFromScore
import com.ideastockexchange.app.model.unrealizedPnL
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class PortfolioRow(
    val position: Position,
    val markPrice: Double?,
    val unrealizedPnL: Double,
)

data class PortfolioUiState(
    val portfolio: Portfolio,
    val marks: Map<Int, Double>,
    val rows: List<PortfolioRow>,
    val equity: Double,
    val totalPnL: Double,
    val refreshing: Boolean,
)

class PortfolioViewModel(
    application: Application,
) : AndroidViewModel(application) {

    private val api: IseApi = IseApi()
    private val store = PortfolioStore.get(application)

    // Live mark-to-market cache. Refreshed on screen entry and on manual pull.
    private val marks = mutableStateMapOf<Int, Double>()
    var refreshing by mutableStateOf(false)
        private set
    var lastError: String? by mutableStateOf(null)
        private set

    val portfolioFlow: StateFlow<Portfolio> = store.state.stateIn(
        scope = viewModelScope,
        started = SharingStarted.Eagerly,
        initialValue = store.state.value,
    )

    fun uiState(): PortfolioUiState {
        val portfolio = portfolioFlow.value
        val rows = portfolio.positions.map { p ->
            val mark = marks[p.beliefId]
            PortfolioRow(
                position = p,
                markPrice = mark,
                unrealizedPnL = if (mark != null) p.unrealizedPnL(mark) else 0.0,
            )
        }
        val equity = portfolio.equity(marks.toMap())
        val totalPnL = equity - Portfolio.STARTING_CASH
        return PortfolioUiState(
            portfolio = portfolio,
            marks = marks.toMap(),
            rows = rows,
            equity = equity,
            totalPnL = totalPnL,
            refreshing = refreshing,
        )
    }

    fun refresh() {
        if (refreshing) return
        refreshing = true
        lastError = null
        viewModelScope.launch {
            val ids = portfolioFlow.value.positions.map { it.beliefId }.toSet()
            ids.forEach { id ->
                try {
                    val response = api.fetchBelief(id)
                    val price = priceFromScore(
                        response.scores.strengthAdjustedScore,
                        response.scores.overallScore,
                    )
                    if (price != null) marks[id] = price
                } catch (t: Throwable) {
                    lastError = t.message ?: "Network error"
                }
            }
            refreshing = false
        }
    }

    fun closePosition(positionId: String, mark: Double) {
        viewModelScope.launch { store.closePosition(positionId, mark) }
    }

    fun resetPortfolio() {
        viewModelScope.launch {
            store.reset()
            marks.clear()
        }
    }
}
