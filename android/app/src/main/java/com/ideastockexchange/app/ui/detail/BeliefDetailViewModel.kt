package com.ideastockexchange.app.ui.detail

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.ideastockexchange.app.api.IseApi
import com.ideastockexchange.app.data.PortfolioStore
import com.ideastockexchange.app.model.BeliefDetailResponse
import com.ideastockexchange.app.model.Side
import com.ideastockexchange.app.model.priceFromScore
import kotlinx.coroutines.launch

sealed interface BeliefDetailState {
    data object Loading : BeliefDetailState
    data class Loaded(val response: BeliefDetailResponse) : BeliefDetailState
    data class Error(val message: String) : BeliefDetailState
}

class BeliefDetailViewModel(
    application: Application,
) : AndroidViewModel(application) {

    private val api: IseApi = IseApi()
    private val portfolioStore = PortfolioStore.get(application)

    var state: BeliefDetailState by mutableStateOf(BeliefDetailState.Loading)
        private set
    var tradeFeedback: String? by mutableStateOf(null)
        private set
    var cash: Double by mutableStateOf(portfolioStore.state.value.cash)
        private set

    private var loadedId: Int = -1

    init {
        viewModelScope.launch {
            portfolioStore.state.collect { cash = it.cash }
        }
    }

    fun loadIfNeeded(id: Int) {
        if (loadedId == id && state is BeliefDetailState.Loaded) return
        loadedId = id
        state = BeliefDetailState.Loading
        viewModelScope.launch {
            state = try {
                BeliefDetailState.Loaded(api.fetchBelief(id))
            } catch (t: Throwable) {
                BeliefDetailState.Error(t.message ?: "Network error")
            }
        }
    }

    fun currentPrice(): Double? {
        val loaded = state as? BeliefDetailState.Loaded ?: return null
        val s = loaded.response.scores
        return priceFromScore(s.strengthAdjustedScore, s.overallScore)
    }

    fun openPosition(side: Side, shares: Int) {
        val loaded = state as? BeliefDetailState.Loaded ?: return
        val price = currentPrice() ?: run {
            tradeFeedback = "No live price for this belief yet."
            return
        }
        val belief = loaded.response.belief
        viewModelScope.launch {
            tradeFeedback = when (val r = portfolioStore.openPosition(
                beliefId = belief.id,
                statement = belief.statement,
                side = side,
                shares = shares,
                price = price,
            )) {
                is PortfolioStore.TradeResult.Ok -> {
                    val verb = if (side == Side.LONG) "Bought" else "Shorted"
                    "$verb $shares @ $${"%.2f".format(price)}."
                }
                is PortfolioStore.TradeResult.Error -> r.message
                is PortfolioStore.TradeResult.Closed -> null
            }
        }
    }

    fun clearFeedback() { tradeFeedback = null }
}
