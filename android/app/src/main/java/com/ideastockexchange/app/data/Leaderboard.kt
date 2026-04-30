package com.ideastockexchange.app.data

import com.ideastockexchange.app.model.Portfolio

// Top-10 leaderboard. The current user's row is computed live from the
// PortfolioStore (cash + mark-to-market open positions). The other nine slots
// come from a small static seed of fictional traders so the screen has
// something to compare against on a fresh install. When/if a real backend
// leaderboard endpoint exists we can swap this out for an HTTP fetch.

data class LeaderboardEntry(
    val rank: Int,
    val displayName: String,
    val netWorth: Double,
    val isCurrentUser: Boolean,
)

object Leaderboard {

    private data class Seed(val name: String, val netWorth: Double)

    private val seedTraders = listOf(
        Seed("MarketMaven", 18_420.50),
        Seed("ContrarianCarl", 16_775.00),
        Seed("ShortSqueezeSara", 15_910.25),
        Seed("AlphaAlchemist", 14_050.75),
        Seed("BeliefBaron", 13_220.10),
        Seed("ReasonRanger", 12_405.60),
        Seed("ProConPro", 11_780.00),
        Seed("SteelmanSteve", 11_120.40),
        Seed("EdgeOfReason", 10_555.85),
    )

    fun build(currentUserNetWorth: Double, currentUserName: String = "You"): List<LeaderboardEntry> {
        val all = seedTraders.map { it.name to it.netWorth } +
            (currentUserName to currentUserNetWorth)
        return all
            .sortedByDescending { it.second }
            .take(10)
            .mapIndexed { idx, (name, net) ->
                LeaderboardEntry(
                    rank = idx + 1,
                    displayName = name,
                    netWorth = net,
                    isCurrentUser = name == currentUserName,
                )
            }
    }
}
