package com.ideastockexchange.app.ui.list

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ideastockexchange.app.api.IseApi
import com.ideastockexchange.app.model.BeliefSummary
import kotlinx.coroutines.launch

sealed interface BeliefsListState {
    data object Loading : BeliefsListState
    data class Loaded(val beliefs: List<BeliefSummary>) : BeliefsListState
    data class Error(val message: String) : BeliefsListState
}

class BeliefsListViewModel(
    private val api: IseApi = IseApi(),
) : ViewModel() {

    var state: BeliefsListState by mutableStateOf(BeliefsListState.Loading)
        private set

    init { reload() }

    fun reload() {
        state = BeliefsListState.Loading
        viewModelScope.launch {
            state = try {
                BeliefsListState.Loaded(api.fetchBeliefs())
            } catch (t: Throwable) {
                BeliefsListState.Error(t.message ?: "Network error")
            }
        }
    }
}
