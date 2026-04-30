import SwiftUI

/// Single-belief detail screen. Splits arguments into "Reasons to Agree" and
/// "Reasons to Disagree", surfaces the belief's costs/benefits/risks and
/// likelihoods, and exposes Buy/Short trade buttons that open positions in
/// the on-device trading game. Tapping an argument navigates into that
/// argument's child belief — the user can recursively traverse the reason
/// graph from here.
struct BeliefDetailView: View {
    let beliefId: Int
    let initialStatement: String

    @ObservedObject private var store = PortfolioStore.shared

    @State private var detail: BeliefDetailResponse?
    @State private var loadError: String?
    @State private var pendingSide: Side?
    @State private var feedbackMessage: String?

    private var price: Double? {
        guard let scores = detail?.scores else { return nil }
        return priceFromScore(
            strengthAdjusted: scores.strengthAdjustedScore,
            overall: scores.overallScore
        )
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text(detail?.belief.statement ?? initialStatement)
                    .font(.title3.weight(.semibold))
                    .fixedSize(horizontal: false, vertical: true)

                ScoreBanner(scores: detail?.scores)

                if let error = loadError {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                if let detail {
                    TradeBar(
                        price: price,
                        cash: store.portfolio.cash,
                        onBuy: { pendingSide = .long },
                        onShort: { pendingSide = .short }
                    )

                    if let cba = detail.belief.costBenefitAnalysis {
                        CostBenefitCard(cba: cba,
                                        cbaLikelihoodScore: detail.scores.cbaLikelihoodScore)
                    }

                    if let impact = detail.belief.impactAnalysis {
                        ImpactCard(impact: impact)
                    }

                    let pro = detail.belief.arguments.filter { $0.isPro }
                    let con = detail.belief.arguments.filter { !$0.isPro }

                    ArgumentList(title: "Reasons to Agree",
                                 systemImage: "hand.thumbsup.fill",
                                 tint: .green,
                                 arguments: pro)

                    ArgumentList(title: "Reasons to Disagree",
                                 systemImage: "hand.thumbsdown.fill",
                                 tint: .red,
                                 arguments: con)

                    if pro.isEmpty && con.isEmpty {
                        Text("No reasons recorded yet.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    ProgressView().frame(maxWidth: .infinity)
                }
            }
            .padding()
        }
        .navigationTitle("Belief")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: ChildBelief.self) { child in
            BeliefDetailView(beliefId: child.id, initialStatement: child.statement)
        }
        .task(id: beliefId) { await load() }
        .sheet(item: $pendingSide) { side in
            if let detail, let price {
                TradeSheet(
                    statement: detail.belief.statement,
                    side: side,
                    pricePerShare: price,
                    cashAvailable: store.portfolio.cash,
                    onConfirm: { shares in
                        confirmTrade(side: side, shares: shares, price: price)
                    },
                    onCancel: { pendingSide = nil }
                )
            }
        }
        .overlay(alignment: .bottom) {
            if let feedbackMessage {
                Text(feedbackMessage)
                    .font(.footnote.weight(.medium))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(.ultraThinMaterial, in: Capsule())
                    .padding(.bottom, 16)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
            }
        }
        .animation(.easeInOut, value: feedbackMessage)
    }

    // MARK: - Actions

    private func load() async {
        do {
            self.detail = try await ISEAPI.shared.fetchBelief(id: beliefId)
            self.loadError = nil
        } catch {
            self.loadError = error.localizedDescription
        }
    }

    private func confirmTrade(side: Side, shares: Int, price: Double) {
        guard let belief = detail?.belief else { return }
        let result = store.openPosition(
            beliefId: belief.id,
            statement: belief.statement,
            side: side,
            shares: shares,
            price: price
        )
        switch result {
        case .opened:
            let verb = side == .long ? "Bought" : "Shorted"
            showFeedback("\(verb) \(shares) @ $\(String(format: "%.2f", price))")
        case .error(let message):
            showFeedback(message)
        case .closed:
            break
        }
        pendingSide = nil
    }

    private func showFeedback(_ message: String) {
        feedbackMessage = message
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            if feedbackMessage == message { feedbackMessage = nil }
        }
    }
}

// MARK: - Side conformance for .sheet(item:)

extension Side: Identifiable {
    var id: String { rawValue }
}

// MARK: - Score banner

private struct ScoreBanner: View {
    let scores: BeliefScores?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 12) {
                ScoreChip(label: "Pro",
                          value: scores?.totalPro,
                          tint: .green,
                          sign: "+")
                ScoreChip(label: "Con",
                          value: scores?.totalCon,
                          tint: .red,
                          sign: "-")
            }
            if scores?.overallScore != nil || scores?.strengthAdjustedScore != nil {
                HStack(spacing: 12) {
                    if let overall = scores?.overallScore {
                        ScoreChip(label: "Overall",
                                  value: overall * 100,
                                  tint: .accentColor,
                                  sign: "",
                                  suffix: "%")
                    }
                    if let strength = scores?.strengthAdjustedScore {
                        ScoreChip(label: "Strength-adj.",
                                  value: strength * 100,
                                  tint: .accentColor,
                                  sign: "",
                                  suffix: "%")
                    }
                }
            }
        }
    }
}

private struct ScoreChip: View {
    let label: String
    let value: Double?
    let tint: Color
    let sign: String
    var suffix: String = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            if let value {
                Text("\(sign)\(value, specifier: "%.1f")\(suffix)")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(tint)
                    .monospacedDigit()
            } else {
                Text("—")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(tint.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Trade bar

private struct TradeBar: View {
    let price: Double?
    let cash: Double
    let onBuy: () -> Void
    let onShort: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                StatTile(label: "Market price",
                         value: price.map { String(format: "$%.2f / share", $0) } ?? "—")
                StatTile(label: "Cash on hand",
                         value: String(format: "$%.2f", cash))
            }
            HStack(spacing: 8) {
                Button(action: onBuy) {
                    Label("Buy (Long)", systemImage: "arrow.up.right")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
                .disabled(price == nil)

                Button(action: onShort) {
                    Label("Short", systemImage: "arrow.down.right")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
                .disabled(price == nil)
            }
            .controlSize(.large)

            if price == nil {
                Text("No score on file yet — this idea isn't tradeable until it has an overall or strength-adjusted score.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Cost-benefit / impact

private struct CostBenefitCard: View {
    let cba: CostBenefitAnalysis
    let cbaLikelihoodScore: Double?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Cost-Benefit Analysis")
                .font(.subheadline.weight(.semibold))

            if let benefits = cba.benefits, !benefits.isEmpty {
                LabeledBlock(label: "Benefits",
                             text: benefits,
                             tint: .green,
                             likelihood: cba.benefitLikelihood)
            }
            if let costs = cba.costs, !costs.isEmpty {
                LabeledBlock(label: "Costs",
                             text: costs,
                             tint: .red,
                             likelihood: cba.costLikelihood)
            }
            if let cbaLikelihoodScore {
                Text("Net CBA likelihood: \(Int(cbaLikelihoodScore * 100))%")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
    }
}

private struct LabeledBlock: View {
    let label: String
    let text: String
    let tint: Color
    let likelihood: Double?

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(label)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(tint)
                if let likelihood {
                    Text("likelihood \(Int(likelihood * 100))%")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            Text(text)
                .font(.footnote)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

private struct ImpactCard: View {
    let impact: ImpactAnalysis

    private var rows: [(String, String)] {
        var out: [(String, String)] = []
        if let value = impact.shortTermEffects, !value.isEmpty { out.append(("Short-term effects", value)) }
        if let value = impact.shortTermCosts,   !value.isEmpty { out.append(("Short-term costs",   value)) }
        if let value = impact.longTermEffects,  !value.isEmpty { out.append(("Long-term effects",  value)) }
        if let value = impact.longTermChanges,  !value.isEmpty { out.append(("Long-term changes",  value)) }
        return out
    }

    var body: some View {
        if rows.isEmpty {
            EmptyView()
        } else {
            VStack(alignment: .leading, spacing: 8) {
                Text("Impact & Risks")
                    .font(.subheadline.weight(.semibold))
                ForEach(rows, id: \.0) { row in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(row.0)
                            .font(.caption.weight(.semibold))
                        Text(row.1)
                            .font(.footnote)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
        }
    }
}

// MARK: - Argument list

private struct ArgumentList: View {
    let title: String
    let systemImage: String
    let tint: Color
    let arguments: [Argument]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Label(title, systemImage: systemImage)
                    .font(.headline)
                    .foregroundStyle(tint)
                Text("(\(arguments.count))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if arguments.isEmpty {
                Text("None recorded.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                VStack(spacing: 8) {
                    ForEach(arguments) { argument in
                        NavigationLink(value: argument.belief) {
                            ArgumentRow(argument: argument, tint: tint)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

private struct ArgumentRow: View {
    let argument: Argument
    let tint: Color

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(argument.belief.statement)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                Text(scoreLine)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(12)
        .background(tint.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(tint.opacity(0.2), lineWidth: 1)
        )
    }

    private var scoreLine: String {
        var parts = [
            String(format: "Impact %.2f", argument.impactScore),
            String(format: "Linkage %.2f", argument.linkageScore),
        ]
        if let importance = argument.importanceScore {
            parts.append(String(format: "Importance %.2f", importance))
        }
        return parts.joined(separator: " · ")
    }
}

#Preview {
    NavigationStack {
        BeliefDetailView(beliefId: 1, initialStatement: "Sample belief statement")
    }
}
