package com.ideastockexchange.app.ui.list

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ideastockexchange.app.model.BeliefSummary

@Composable
fun BeliefsListScreen(
    onBeliefClick: (BeliefSummary) -> Unit,
    viewModel: BeliefsListViewModel = viewModel(),
) {
    val state = viewModel.state
    var search by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp)) {
        OutlinedTextField(
            value = search,
            onValueChange = { search = it },
            placeholder = { Text("Search beliefs") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        )

        when (state) {
            is BeliefsListState.Loading -> CenteredSpinner()
            is BeliefsListState.Error -> ErrorView(state.message) { viewModel.reload() }
            is BeliefsListState.Loaded -> {
                val filtered = remember(state.beliefs, search) {
                    if (search.isBlank()) state.beliefs
                    else state.beliefs.filter {
                        it.canonicalText.contains(search, ignoreCase = true)
                    }
                }
                LazyColumn(
                    contentPadding = PaddingValues(vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(0.dp),
                ) {
                    items(filtered, key = { it.beliefId }) { belief ->
                        BeliefRow(belief, onClick = { onBeliefClick(belief) })
                        HorizontalDivider(color = Color(0x14000000))
                    }
                }
            }
        }
    }
}

@Composable
private fun BeliefRow(belief: BeliefSummary, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 12.dp, horizontal = 4.dp)
    ) {
        Text(
            text = belief.canonicalText,
            style = MaterialTheme.typography.bodyLarge,
        )
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(top = 4.dp),
        ) {
            belief.parentTopicId?.takeIf { it.isNotEmpty() }?.let { topic ->
                Pill(text = topic)
            }
            belief.spectrumCoordinates?.valence?.let { v ->
                Text(
                    text = "valence ${if (v >= 0) "+$v" else "$v"}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary,
                )
            }
        }
    }
}

@Composable
private fun Pill(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelSmall,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0x1F000000))
            .padding(horizontal = 8.dp, vertical = 2.dp),
    )
}

@Composable
private fun CenteredSpinner() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) { CircularProgressIndicator() }
}

@Composable
private fun ErrorView(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Couldn't load", style = MaterialTheme.typography.titleMedium)
        Text(message, style = MaterialTheme.typography.bodySmall)
        Button(onClick = onRetry, modifier = Modifier.padding(top = 12.dp)) {
            Text("Try again")
        }
    }
}
