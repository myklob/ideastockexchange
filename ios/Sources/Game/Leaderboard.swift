import Foundation

/// Top-10 leaderboard. The current user's row is computed live from the
/// PortfolioStore (cash + mark-to-market open positions). The other nine slots
/// come from a small static seed of fictional traders so the screen has
/// something to compare against on a fresh install. When/if a real backend
/// leaderboard endpoint exists we can swap this out for an HTTP fetch.
///
/// Mirrors `android/.../data/Leaderboard.kt` so the two platforms feel
/// identical at the leaderboard tab.

struct LeaderboardEntry: Identifiable, Hashable {
    let rank: Int
    let displayName: String
    let netWorth: Double
    let isCurrentUser: Bool

    var id: String { "\(rank)-\(displayName)" }
}

enum Leaderboard {
    private struct Seed { let name: String; let netWorth: Double }

    private static let seedTraders: [Seed] = [
        Seed(name: "MarketMaven",      netWorth: 18_420.50),
        Seed(name: "ContrarianCarl",   netWorth: 16_775.00),
        Seed(name: "ShortSqueezeSara", netWorth: 15_910.25),
        Seed(name: "AlphaAlchemist",   netWorth: 14_050.75),
        Seed(name: "BeliefBaron",      netWorth: 13_220.10),
        Seed(name: "ReasonRanger",     netWorth: 12_405.60),
        Seed(name: "ProConPro",        netWorth: 11_780.00),
        Seed(name: "SteelmanSteve",    netWorth: 11_120.40),
        Seed(name: "EdgeOfReason",     netWorth: 10_555.85),
    ]

    static func build(currentUserNetWorth: Double, currentUserName: String = "You") -> [LeaderboardEntry] {
        let combined: [(String, Double)] =
            seedTraders.map { ($0.name, $0.netWorth) }
            + [(currentUserName, currentUserNetWorth)]

        return combined
            .sorted { $0.1 > $1.1 }
            .prefix(10)
            .enumerated()
            .map { idx, pair in
                LeaderboardEntry(
                    rank: idx + 1,
                    displayName: pair.0,
                    netWorth: pair.1,
                    isCurrentUser: pair.0 == currentUserName
                )
            }
    }
}
