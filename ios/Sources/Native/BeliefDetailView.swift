import SwiftUI

/// Single-belief detail screen. Splits arguments into "Reasons to Agree" and
/// "Reasons to Disagree", each row showing the argument's impact score. Tapping
/// an argument navigates into that argument's child belief — the user can
/// recursively traverse the reason graph from here.
struct BeliefDetailView: View {
    let beliefId: Int
    let initialStatement: String

    @State private var detail: BeliefDetailResponse?
    @State private var loadError: String?

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
    }

    private func load() async {
        do {
            let response = try await ISEAPI.shared.fetchBelief(id: beliefId)
            self.detail = response
            self.loadError = nil
        } catch {
            self.loadError = error.localizedDescription
        }
    }
}

private struct ScoreBanner: View {
    let scores: BeliefScores?

    var body: some View {
        HStack(spacing: 16) {
            ScoreChip(label: "Pro",
                      value: scores?.totalPro,
                      tint: .green,
                      sign: "+")
            ScoreChip(label: "Con",
                      value: scores?.totalCon,
                      tint: .red,
                      sign: "-")
        }
    }
}

private struct ScoreChip: View {
    let label: String
    let value: Double?
    let tint: Color
    let sign: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            if let value {
                Text("\(sign)\(value, specifier: "%.1f")")
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

private struct ArgumentList: View {
    let title: String
    let systemImage: String
    let tint: Color
    let arguments: [Argument]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: systemImage)
                .font(.headline)
                .foregroundStyle(tint)

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
                Text("Impact \(argument.impactScore, specifier: "%.2f")  ·  Linkage \(argument.linkageScore, specifier: "%.2f")")
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
}

#Preview {
    NavigationStack {
        BeliefDetailView(beliefId: 1, initialStatement: "Sample belief statement")
    }
}
