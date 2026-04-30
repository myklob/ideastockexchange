package com.ideastockexchange.app.ui.leaderboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ideastockexchange.app.data.LeaderboardEntry
import com.ideastockexchange.app.model.Portfolio
import com.ideastockexchange.app.ui.theme.ConRed
import com.ideastockexchange.app.ui.theme.ProGreen

@Composable
fun LeaderboardScreen(viewModel: LeaderboardViewModel = viewModel()) {
    val entries = viewModel.entries
    val refreshing = viewModel.refreshing

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Top 10 Traders", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(
                    "Ranked by net worth (cash + open positions, marked to market).",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary,
                )
            }
            OutlinedButton(onClick = { viewModel.refresh() }, enabled = !refreshing) {
                Text(if (refreshing) "…" else "Refresh")
            }
        }
        LazyColumn(
            contentPadding = PaddingValues(vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.fillMaxSize(),
        ) {
            items(entries, key = { it.rank.toString() + it.displayName }) { entry ->
                LeaderboardRow(entry)
            }
        }
    }
}

@Composable
private fun LeaderboardRow(entry: LeaderboardEntry) {
    val rowBg = if (entry.isCurrentUser) MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)
    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
    val pnl = entry.netWorth - Portfolio.STARTING_CASH
    val pnlTint = if (pnl >= 0) ProGreen else ConRed

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(rowBg)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        RankBadge(entry.rank)
        Column(modifier = Modifier.weight(1f)) {
            Text(
                entry.displayName + if (entry.isCurrentUser) " (you)" else "",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = if (entry.isCurrentUser) FontWeight.SemiBold else FontWeight.Normal,
            )
            Text(
                "${if (pnl >= 0) "+" else "-"}$${"%.2f".format(kotlin.math.abs(pnl))} P&L",
                style = MaterialTheme.typography.labelSmall,
                color = pnlTint,
            )
        }
        Text(
            "$${"%.2f".format(entry.netWorth)}",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun RankBadge(rank: Int) {
    val tint = when (rank) {
        1 -> Color(0xFFFFD700)
        2 -> Color(0xFFC0C0C0)
        3 -> Color(0xFFCD7F32)
        else -> MaterialTheme.colorScheme.surfaceVariant
    }
    val textColor = if (rank <= 3) Color.Black else MaterialTheme.colorScheme.onSurface
    androidx.compose.foundation.layout.Box(
        modifier = Modifier
            .size(32.dp)
            .clip(CircleShape)
            .background(tint),
        contentAlignment = Alignment.Center,
    ) {
        Text("$rank", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = textColor)
    }
}
