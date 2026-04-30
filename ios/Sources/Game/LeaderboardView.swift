import SwiftUI

/// Leaderboard tab: ranks the top 10 traders by net worth (cash + positions
/// marked to the latest fetched score). Nine slots are seed traders so the
/// screen has comparators on a fresh install; the tenth is the user.
struct LeaderboardView: View {
    @ObservedObject private var store = PortfolioStore.shared

    @State private var marks: [Int: Double] = [:]
    @State private var refreshing = false

    private var entries: [LeaderboardEntry] {
        let net = store.portfolio.equity(marks: marks)
        return Leaderboard.build(currentUserNetWorth: net)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                header
                ForEach(entries) { entry in
                    LeaderboardRow(entry: entry)
                }
            }
            .padding(16)
        }
        .navigationTitle("Top 10")
        .refreshable { await refresh() }
        .task { await refresh() }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Top 10 Traders")
                    .font(.headline)
                Text("Ranked by net worth (cash + open positions, marked to market).")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Button {
                Task { await refresh() }
            } label: {
                if refreshing {
                    ProgressView().controlSize(.small)
                } else {
                    Image(systemName: "arrow.clockwise")
                }
            }
            .buttonStyle(.bordered)
            .disabled(refreshing)
        }
    }

    private func refresh() async {
        guard !refreshing else { return }
        refreshing = true
        defer { refreshing = false }

        let ids = Set(store.portfolio.positions.map(\.beliefId))
        for id in ids {
            do {
                let response = try await ISEAPI.shared.fetchBelief(id: id)
                if let price = priceFromScore(
                    strengthAdjusted: response.scores.strengthAdjustedScore,
                    overall: response.scores.overallScore
                ) {
                    marks[id] = price
                }
            } catch {
                // One failed fetch shouldn't blank the leaderboard — keep prior mark.
            }
        }
    }
}

private struct LeaderboardRow: View {
    let entry: LeaderboardEntry

    private var pnl: Double { entry.netWorth - Portfolio.startingCash }
    private var pnlTint: Color { pnl >= 0 ? .green : .red }
    private var rowBackground: Color {
        entry.isCurrentUser
            ? Color.accentColor.opacity(0.12)
            : Color.secondary.opacity(0.08)
    }

    var body: some View {
        HStack(spacing: 12) {
            RankBadge(rank: entry.rank)

            VStack(alignment: .leading, spacing: 2) {
                Text(entry.displayName + (entry.isCurrentUser ? " (you)" : ""))
                    .font(.body)
                    .fontWeight(entry.isCurrentUser ? .semibold : .regular)
                Text(String(format: "%@$%.2f P&L",
                            pnl >= 0 ? "+" : "-",
                            abs(pnl)))
                    .font(.caption)
                    .foregroundStyle(pnlTint)
                    .monospacedDigit()
            }

            Spacer()

            Text(String(format: "$%.2f", entry.netWorth))
                .font(.subheadline.weight(.semibold))
                .monospacedDigit()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(rowBackground, in: RoundedRectangle(cornerRadius: 10))
    }
}

private struct RankBadge: View {
    let rank: Int

    private var tint: Color {
        switch rank {
        case 1: return Color(red: 1.0,  green: 0.84, blue: 0.0)   // gold
        case 2: return Color(red: 0.75, green: 0.75, blue: 0.75)  // silver
        case 3: return Color(red: 0.80, green: 0.50, blue: 0.20)  // bronze
        default: return Color.secondary.opacity(0.25)
        }
    }
    private var textColor: Color { rank <= 3 ? .black : .primary }

    var body: some View {
        Text("\(rank)")
            .font(.caption.weight(.bold))
            .foregroundStyle(textColor)
            .frame(width: 32, height: 32)
            .background(tint, in: Circle())
    }
}

#Preview {
    NavigationStack { LeaderboardView() }
}
