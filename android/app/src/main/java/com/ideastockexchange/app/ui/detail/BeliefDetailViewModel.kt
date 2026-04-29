package com.ideastockexchange.app.ui.detail

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ideastockexchange.app.api.IseApi
import com.ideastockexchange.app.model.BeliefDetailResponse
import kotlinx.coroutines.launch

sealed interface BeliefDetailState {
    data object Loading : BeliefDetailState
    data class Loaded(val response: BeliefDetailResponse) : BeliefDetailState
    data class Error(val message: String) : BeliefDetailState
}

class BeliefDetailViewModel(
    private val api: IseApi = IseApi(),
) : ViewModel() {

    var state: BeliefDetailState by mutableStateOf(BeliefDetailState.Loading)
        private set

    private var loadedId: Int = -1

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
}
