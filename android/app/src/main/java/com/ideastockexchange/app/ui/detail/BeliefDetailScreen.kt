package com.ideastockexchange.app.ui.detail

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.ThumbDown
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.ideastockexchange.app.model.Argument
import com.ideastockexchange.app.model.BeliefScores
import com.ideastockexchange.app.model.CostBenefitAnalysis
import com.ideastockexchange.app.model.ImpactAnalysis
import com.ideastockexchange.app.model.Side
import com.ideastockexchange.app.ui.theme.ConRed
import com.ideastockexchange.app.ui.theme.ProGreen
import com.ideastockexchange.app.ui.trade.TradeDialog

@Composable
fun BeliefDetailScreen(
    beliefId: Int,
    initialStatement: String,
    onArgumentClick: (childId: Int, statement: String) -> Unit,
    viewModel: BeliefDetailViewModel = viewModel(),
) {
    LaunchedEffect(beliefId) { viewModel.loadIfNeeded(beliefId) }
    val state = viewModel.state
    val snackbarHostState = remember { SnackbarHostState() }
    var pendingSide: Side? by remember { mutableStateOf(null) }

    LaunchedEffect(viewModel.tradeFeedback) {
        viewModel.tradeFeedback?.let {
            snackbarHostState.showSnackbar(it, duration = SnackbarDuration.Short)
            viewModel.clearFeedback()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        when (state) {
            is BeliefDetailState.Loading -> {
                Text(initialStatement, style = MaterialTheme.typography.titleLarge)
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is BeliefDetailState.Error -> {
                Text(initialStatement, style = MaterialTheme.typography.titleLarge)
                Text(state.message, color = ConRed, style = MaterialTheme.typography.bodySmall)
                Button(onClick = { viewModel.loadIfNeeded(beliefId) }) {
                    Text("Try again")
                }
            }
            is BeliefDetailState.Loaded -> {
                val belief = state.response.belief
                val scores = state.response.scores

                Text(belief.statement, style = MaterialTheme.typography.titleLarge)

                ScoreBanner(scores)

                TradeBar(
                    price = viewModel.currentPrice(),
                    cash = viewModel.cash,
                    onBuy = { pendingSide = Side.LONG },
                    onShort = { pendingSide = Side.SHORT },
                )

                belief.costBenefitAnalysis?.let { CostBenefitCard(it, scores.cbaLikelihoodScore) }
                belief.impactAnalysis?.let { ImpactCard(it) }

                val pro = belief.arguments.filter { it.isPro }
                val con = belief.arguments.filterNot { it.isPro }

                ArgumentList(
                    title = "Reasons to Agree",
                    tint = ProGreen,
                    isPro = true,
                    arguments = pro,
                    onArgumentClick = onArgumentClick,
                )
                ArgumentList(
                    title = "Reasons to Disagree",
                    tint = ConRed,
                    isPro = false,
                    arguments = con,
                    onArgumentClick = onArgumentClick,
                )

                if (pro.isEmpty() && con.isEmpty()) {
                    Text(
                        "No reasons recorded yet.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.secondary,
                    )
                }

                pendingSide?.let { side ->
                    val price = viewModel.currentPrice()
                    if (price != null) {
                        TradeDialog(
                            statement = belief.statement,
                            side = side,
                            pricePerShare = price,
                            cashAvailable = viewModel.cash,
                            onDismiss = { pendingSide = null },
                            onConfirm = { shares ->
                                viewModel.openPosition(side, shares)
                                pendingSide = null
                            },
                        )
                    } else {
                        pendingSide = null
                    }
                }
            }
        }
    }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter).padding(12.dp),
        )
    }
}

@Composable
private fun TradeBar(
    price: Double?,
    cash: Double,
    onBuy: () -> Unit,
    onShort: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Market price", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
                Text(
                    if (price != null) "$${"%.2f".format(price)} / share" else "—",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text("Cash on hand", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
                Text("$${"%.2f".format(cash)}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = onBuy,
                enabled = price != null,
                colors = ButtonDefaults.buttonColors(containerColor = ProGreen),
                modifier = Modifier.weight(1f),
            ) { Text("Buy (Long)") }
            Button(
                onClick = onShort,
                enabled = price != null,
                colors = ButtonDefaults.buttonColors(containerColor = ConRed),
                modifier = Modifier.weight(1f),
            ) { Text("Short") }
        }
        if (price == null) {
            Text(
                "No score on file yet — this idea isn't tradeable until it has an overall or strength-adjusted score.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.secondary,
            )
        }
    }
}

@Composable
private fun ScoreBanner(scores: BeliefScores) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        ScoreChip(
            label = "Pro",
            value = scores.totalPro,
            tint = ProGreen,
            sign = "+",
            modifier = Modifier.weight(1f),
        )
        ScoreChip(
            label = "Con",
            value = scores.totalCon,
            tint = ConRed,
            sign = "-",
            modifier = Modifier.weight(1f),
        )
    }
    if (scores.overallScore != null || scores.strengthAdjustedScore != null) {
        Row(modifier = Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            scores.overallScore?.let {
                ScoreChip(
                    label = "Overall",
                    value = it * 100,
                    tint = MaterialTheme.colorScheme.primary,
                    sign = "",
                    suffix = "%",
                    modifier = Modifier.weight(1f),
                )
            }
            scores.strengthAdjustedScore?.let {
                ScoreChip(
                    label = "Strength-adj.",
                    value = it * 100,
                    tint = MaterialTheme.colorScheme.primary,
                    sign = "",
                    suffix = "%",
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun ScoreChip(
    label: String,
    value: Double?,
    tint: Color,
    sign: String,
    modifier: Modifier = Modifier,
    suffix: String = "",
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(tint.copy(alpha = 0.10f))
            .padding(12.dp)
    ) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Text(
            text = if (value != null) "$sign${"%.1f".format(value)}$suffix" else "—",
            style = MaterialTheme.typography.titleMedium,
            color = tint,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun CostBenefitCard(cba: CostBenefitAnalysis, cbaLikelihoodScore: Double?) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text("Cost-Benefit Analysis", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
        cba.benefits?.takeIf { it.isNotBlank() }?.let {
            LabeledBlock(label = "Benefits", body = it, tint = ProGreen, likelihood = cba.benefitLikelihood)
        }
        cba.costs?.takeIf { it.isNotBlank() }?.let {
            LabeledBlock(label = "Costs", body = it, tint = ConRed, likelihood = cba.costLikelihood)
        }
        cbaLikelihoodScore?.let {
            Text(
                "Net CBA likelihood: ${"%.0f".format(it * 100)}%",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary,
            )
        }
    }
}

@Composable
private fun LabeledBlock(label: String, body: String, tint: Color, likelihood: Double?) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = tint, fontWeight = FontWeight.SemiBold)
            likelihood?.let {
                Text(
                    "likelihood ${"%.0f".format(it * 100)}%",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary,
                )
            }
        }
        Text(body, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 2.dp))
    }
}

@Composable
private fun ImpactCard(impact: ImpactAnalysis) {
    val rows = buildList {
        impact.shortTermEffects?.takeIf { it.isNotBlank() }?.let { add("Short-term effects" to it) }
        impact.shortTermCosts?.takeIf { it.isNotBlank() }?.let { add("Short-term costs" to it) }
        impact.longTermEffects?.takeIf { it.isNotBlank() }?.let { add("Long-term effects" to it) }
        impact.longTermChanges?.takeIf { it.isNotBlank() }?.let { add("Long-term changes" to it) }
    }
    if (rows.isEmpty()) return

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Impact & Risks", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
        rows.forEach { (label, body) ->
            Column {
                Text(label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                Text(body, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun ArgumentList(
    title: String,
    tint: Color,
    isPro: Boolean,
    arguments: List<Argument>,
    onArgumentClick: (childId: Int, statement: String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(
                imageVector = if (isPro) Icons.Filled.ThumbUp else Icons.Filled.ThumbDown,
                contentDescription = null,
                tint = tint,
            )
            Text(title, style = MaterialTheme.typography.titleSmall, color = tint, fontWeight = FontWeight.SemiBold)
            Text(
                "(${arguments.size})",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.secondary,
            )
        }
        if (arguments.isEmpty()) {
            Text("None recorded.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
        } else {
            arguments.forEach { argument ->
                ArgumentRow(argument, tint) {
                    onArgumentClick(argument.belief.id, argument.belief.statement)
                }
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
    }
}

@Composable
private fun ArgumentRow(argument: Argument, tint: Color, onClick: () -> Unit) {
    Row(
        verticalAlignment = Alignment.Top,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .border(1.dp, tint.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
            .background(tint.copy(alpha = 0.07f))
            .clickable { onClick() }
            .padding(12.dp)
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(argument.belief.statement, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = "Impact ${"%.2f".format(argument.impactScore)}  ·  Linkage ${"%.2f".format(argument.linkageScore)}  ·  Importance ${"%.2f".format(argument.importanceScore)}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
        Icon(
            imageVector = Icons.Filled.ChevronRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.secondary,
        )
    }
}
