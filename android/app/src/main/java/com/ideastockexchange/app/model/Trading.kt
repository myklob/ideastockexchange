package com.ideastockexchange.app.model

import kotlinx.serialization.Serializable

// On-device trading game state. The user opens with $10,000 of fake cash and
// can buy long ("underrated") or short ("overrated") any belief whose
// /api/beliefs/[id] response carries a usable score. Persisted as JSON in
// `filesDir/portfolio.json` — see data/PortfolioStore.kt.

@Serializable
data class Portfolio(
    val cash: Double = STARTING_CASH,
    val positions: List<Position> = emptyList(),
    val realizedPnL: Double = 0.0,
    val history: List<TradeEvent> = emptyList(),
) {
    companion object {
        const val STARTING_CASH: Double = 10_000.0
    }
}

@Serializable
data class Position(
    val id: String,
    val beliefId: Int,
    val statement: String,
    val side: Side,
    val shares: Int,
    val openPrice: Double,
    val openedAtMillis: Long,
)

@Serializable
enum class Side { LONG, SHORT }

@Serializable
data class TradeEvent(
    val timestampMillis: Long,
    val beliefId: Int,
    val statement: String,
    val side: Side,
    val action: Action,
    val shares: Int,
    val price: Double,
    val realizedPnL: Double = 0.0,
)

@Serializable
enum class Action { OPEN, CLOSE }

// Shared price formula. We treat the strength-adjusted (or overall) score as a
// 0-1 quality signal and scale to dollars. A flat 1c floor keeps the math
// from blowing up on beliefs whose API record is missing a score.
fun priceFromScore(strengthAdjusted: Double?, overall: Double?): Double? {
    val raw = strengthAdjusted ?: overall ?: return null
    return (raw * 100.0).coerceAtLeast(0.01)
}

// Mark-to-market value if we closed every open position at `currentPrice` (a
// map from beliefId -> latest price). Positions whose price isn't known yet
// fall back to their open price (zero P&L).
fun Portfolio.equity(currentPrice: Map<Int, Double>): Double {
    val open = positions.sumOf { p ->
        val mark = currentPrice[p.beliefId] ?: p.openPrice
        when (p.side) {
            Side.LONG -> p.shares * mark
            // For shorts we hold the original sale proceeds plus any decline.
            Side.SHORT -> p.shares * (2 * p.openPrice - mark)
        }
    }
    return cash + open
}

fun Position.unrealizedPnL(mark: Double): Double = when (side) {
    Side.LONG -> shares * (mark - openPrice)
    Side.SHORT -> shares * (openPrice - mark)
}
