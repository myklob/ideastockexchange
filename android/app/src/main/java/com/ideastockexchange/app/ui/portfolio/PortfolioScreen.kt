package com.ideastockexchange.app.ui.portfolio

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ideastockexchange.app.model.Portfolio
import com.ideastockexchange.app.model.Side
import com.ideastockexchange.app.ui.theme.ConRed
import com.ideastockexchange.app.ui.theme.ProGreen

@Composable
fun PortfolioScreen(viewModel: PortfolioViewModel = viewModel()) {
    val portfolio by viewModel.portfolioFlow.collectAsState()
    LaunchedEffect(portfolio.positions.size) { viewModel.refresh() }
    val ui = viewModel.uiState()
    var showResetDialog by remember { mutableStateOf(false) }

    if (showResetDialog) {
        AlertDialog(
            onDismissRequest = { showResetDialog = false },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.resetPortfolio()
                    showResetDialog = false
                }) { Text("Reset", color = ConRed) }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) { Text("Cancel") }
            },
            title = { Text("Reset portfolio?") },
            text = { Text("All open positions are closed at zero P&L and your cash returns to $${"%.0f".format(Portfolio.STARTING_CASH)}.") },
        )
    }

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp)) {
        SummaryCard(
            cash = portfolio.cash,
            equity = ui.equity,
            totalPnL = ui.totalPnL,
            realizedPnL = portfolio.realizedPnL,
            refreshing = ui.refreshing,
            onRefresh = { viewModel.refresh() },
            onReset = { showResetDialog = true },
        )

        ui.refreshing.let {
            // no-op; SummaryCard shows the spinner state.
        }

        viewModel.lastError?.let {
            Text(
                "Couldn't refresh: $it",
                color = ConRed,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(vertical = 6.dp),
            )
        }

        if (ui.rows.isEmpty()) {
            EmptyState()
        } else {
            LazyColumn(
                contentPadding = PaddingValues(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(ui.rows, key = { it.position.id }) { row ->
                    PositionRow(
                        row = row,
                        onClose = {
                            row.markPrice?.let { mark ->
                                viewModel.closePosition(row.position.id, mark)
                            }
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun SummaryCard(
    cash: Double,
    equity: Double,
    totalPnL: Double,
    realizedPnL: Double,
    refreshing: Boolean,
    onRefresh: () -> Unit,
    onReset: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Portfolio", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Stat("Equity", "$${"%.2f".format(equity)}", modifier = Modifier.weight(1f))
            Stat(
                label = "P&L",
                value = "${if (totalPnL >= 0) "+" else "-"}$${"%.2f".format(kotlin.math.abs(totalPnL))}",
                tint = if (totalPnL >= 0) ProGreen else ConRed,
                modifier = Modifier.weight(1f),
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Stat("Cash", "$${"%.2f".format(cash)}", modifier = Modifier.weight(1f))
            Stat("Realized", "$${"%.2f".format(realizedPnL)}", modifier = Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onRefresh, enabled = !refreshing, modifier = Modifier.weight(1f)) {
                Text(if (refreshing) "Refreshing…" else "Refresh prices")
            }
            OutlinedButton(onClick = onReset, modifier = Modifier.weight(1f)) {
                Text("Reset")
            }
        }
    }
}

@Composable
private fun Stat(label: String, value: String, modifier: Modifier = Modifier, tint: Color? = null) {
    Column(modifier = modifier) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Text(
            value,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            color = tint ?: MaterialTheme.colorScheme.onSurface,
        )
    }
}

@Composable
private fun PositionRow(row: PortfolioRow, onClose: () -> Unit) {
    val tint = if (row.position.side == Side.LONG) ProGreen else ConRed
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .border(1.dp, tint.copy(alpha = 0.30f), RoundedCornerShape(12.dp))
            .background(tint.copy(alpha = 0.06f))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                if (row.position.side == Side.LONG) "LONG" else "SHORT",
                style = MaterialTheme.typography.labelSmall,
                color = tint,
                fontWeight = FontWeight.Bold,
            )
            Text("${row.position.shares} sh", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        }
        Text(row.position.statement, style = MaterialTheme.typography.bodyMedium)
        HorizontalDivider(color = Color(0x14000000))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Stat("Open", "$${"%.2f".format(row.position.openPrice)}", modifier = Modifier.weight(1f))
            Stat(
                label = "Mark",
                value = row.markPrice?.let { "$${"%.2f".format(it)}" } ?: "—",
                modifier = Modifier.weight(1f),
            )
            Stat(
                label = "P&L",
                value = if (row.markPrice != null)
                    "${if (row.unrealizedPnL >= 0) "+" else "-"}$${"%.2f".format(kotlin.math.abs(row.unrealizedPnL))}"
                else "—",
                tint = if (row.markPrice == null) null
                else if (row.unrealizedPnL >= 0) ProGreen else ConRed,
                modifier = Modifier.weight(1f),
            )
        }
        Button(
            onClick = onClose,
            enabled = row.markPrice != null,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (row.markPrice == null) "Close (waiting for price…)" else "Close at $${"%.2f".format(row.markPrice)}")
        }
    }
}

@Composable
private fun EmptyState() {
    Box(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("No open positions yet.", style = MaterialTheme.typography.titleSmall)
            Text(
                "Browse the ideas and tap Buy on ones you think are underrated, or Short on overrated ones.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}
