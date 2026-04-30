import SwiftUI

/// Portfolio tab: shows cash, equity, total P&L, and a list of every open
/// position with its mark-to-market P&L. Each position has a Close button
/// that closes at the latest fetched mark price.
///
/// On screen entry and on pull-to-refresh, we re-fetch each open belief's
/// score so marks stay current.
struct PortfolioView: View {
    @ObservedObject private var store = PortfolioStore.shared

    @State private var marks: [Int: Double] = [:]
    @State private var refreshing = false
    @State private var lastError: String?
    @State private var showResetConfirm = false

    private var equity: Double { store.portfolio.equity(marks: marks) }
    private var totalPnL: Double { equity - Portfolio.startingCash }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                summaryCard

                if let lastError {
                    Label(lastError, systemImage: "exclamationmark.triangle")
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                if store.portfolio.positions.isEmpty {
                    emptyState
                } else {
                    LazyVStack(alignment: .leading, spacing: 10) {
                        ForEach(store.portfolio.positions) { position in
                            PositionCard(
                                position: position,
                                markPrice: marks[position.beliefId],
                                onClose: { close(position) }
                            )
                        }
                    }
                }
            }
            .padding(16)
        }
        .navigationTitle("Portfolio")
        .refreshable { await refresh() }
        .task { await refresh() }
        .onChange(of: store.portfolio.positions) { _, _ in
            Task { await refresh() }
        }
        .alert("Reset portfolio?", isPresented: $showResetConfirm) {
            Button("Reset", role: .destructive) {
                store.reset()
                marks = [:]
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("All open positions are closed at zero P&L and your cash returns to $\(Int(Portfolio.startingCash)).")
        }
    }

    // MARK: - Subviews

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Portfolio")
                .font(.headline)

            HStack(spacing: 12) {
                StatTile(label: "Equity",
                         value: String(format: "$%.2f", equity))
                StatTile(label: "P&L",
                         value: signed(totalPnL),
                         tint: totalPnL >= 0 ? .green : .red)
            }
            HStack(spacing: 12) {
                StatTile(label: "Cash",
                         value: String(format: "$%.2f", store.portfolio.cash))
                StatTile(label: "Realized",
                         value: signed(store.portfolio.realizedPnL),
                         tint: store.portfolio.realizedPnL >= 0 ? .green : .red)
            }
            HStack(spacing: 8) {
                Button {
                    Task { await refresh() }
                } label: {
                    if refreshing {
                        ProgressView().controlSize(.small)
                    } else {
                        Label("Refresh prices", systemImage: "arrow.clockwise")
                    }
                }
                .buttonStyle(.bordered)
                .disabled(refreshing)
                .frame(maxWidth: .infinity)

                Button(role: .destructive) {
                    showResetConfirm = true
                } label: {
                    Label("Reset", systemImage: "arrow.counterclockwise")
                }
                .buttonStyle(.bordered)
                .frame(maxWidth: .infinity)
            }
            .font(.footnote.weight(.semibold))
        }
        .padding(14)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }

    private var emptyState: some View {
        VStack(spacing: 6) {
            Text("No open positions yet.")
                .font(.subheadline.weight(.semibold))
            Text("Browse the ideas and tap Buy on ones you think are underrated, or Short on overrated ones.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
    }

    // MARK: - Actions

    private func refresh() async {
        guard !refreshing else { return }
        refreshing = true
        lastError = nil
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
                lastError = "Couldn't refresh: \(error.localizedDescription)"
            }
        }
    }

    private func close(_ position: Position) {
        guard let mark = marks[position.beliefId] else { return }
        store.closePosition(positionId: position.id, markPrice: mark)
    }

    private func signed(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : "-"
        return String(format: "%@$%.2f", sign, abs(value))
    }
}

// MARK: - Position card

private struct PositionCard: View {
    let position: Position
    let markPrice: Double?
    let onClose: () -> Void

    private var tint: Color { position.side == .long ? .green : .red }
    private var pnl: Double {
        guard let markPrice else { return 0 }
        return position.unrealizedPnL(mark: markPrice)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Text(position.side == .long ? "LONG" : "SHORT")
                    .font(.caption.weight(.heavy))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(tint.opacity(0.18), in: Capsule())
                    .foregroundStyle(tint)
                Text("\(position.shares) sh")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text(position.statement)
                .font(.subheadline)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 12) {
                StatTile(label: "Open",
                         value: String(format: "$%.2f", position.openPrice))
                StatTile(label: "Mark",
                         value: markPrice.map { String(format: "$%.2f", $0) } ?? "—")
                StatTile(
                    label: "P&L",
                    value: markPrice == nil
                        ? "—"
                        : String(format: "%@$%.2f",
                                 pnl >= 0 ? "+" : "-",
                                 abs(pnl)),
                    tint: markPrice == nil ? nil : (pnl >= 0 ? .green : .red)
                )
            }

            Button(action: onClose) {
                Text(markPrice == nil
                     ? "Close (waiting for price…)"
                     : String(format: "Close at $%.2f", markPrice ?? 0))
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(tint)
            .disabled(markPrice == nil)
        }
        .padding(12)
        .background(tint.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(tint.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Shared stat tile

struct StatTile: View {
    let label: String
    let value: String
    var tint: Color? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(tint ?? .primary)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    NavigationStack { PortfolioView() }
}
