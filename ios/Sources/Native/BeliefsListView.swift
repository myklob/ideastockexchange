import SwiftUI

struct BeliefsListView: View {
    @State private var beliefs: [BeliefSummary] = []
    @State private var loadState: LoadState = .idle
    @State private var search: String = ""

    enum LoadState { case idle, loading, loaded, failed(String) }

    private var filtered: [BeliefSummary] {
        guard !search.isEmpty else { return beliefs }
        return beliefs.filter {
            $0.canonicalText.localizedCaseInsensitiveContains(search)
        }
    }

    var body: some View {
        Group {
            switch loadState {
            case .idle, .loading where beliefs.isEmpty:
                ProgressView("Loading beliefs…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

            case .failed(let message):
                ContentUnavailableView {
                    Label("Couldn't load", systemImage: "exclamationmark.triangle")
                } description: {
                    Text(message)
                } actions: {
                    Button("Try again") { Task { await load() } }
                        .buttonStyle(.borderedProminent)
                }

            default:
                List(filtered) { belief in
                    NavigationLink(value: belief) {
                        BeliefRow(belief: belief)
                    }
                }
                .listStyle(.plain)
                .refreshable { await load() }
                .searchable(text: $search, prompt: "Search beliefs")
            }
        }
        .navigationTitle("Beliefs")
        .navigationDestination(for: BeliefSummary.self) { summary in
            BeliefDetailView(beliefId: Int(summary.beliefId) ?? 0,
                             initialStatement: summary.canonicalText)
        }
        .task { if beliefs.isEmpty { await load() } }
    }

    private func load() async {
        loadState = .loading
        do {
            let result = try await ISEAPI.shared.fetchBeliefs(limit: 200)
            self.beliefs = result
            self.loadState = .loaded
        } catch {
            self.loadState = .failed(error.localizedDescription)
        }
    }
}

private struct BeliefRow: View {
    let belief: BeliefSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(belief.canonicalText)
                .font(.body)
                .foregroundStyle(.primary)
            HStack(spacing: 8) {
                if let topic = belief.parentTopicId, !topic.isEmpty {
                    Text(topic)
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.secondary.opacity(0.12), in: Capsule())
                }
                if let v = belief.spectrumCoordinates?.valence {
                    Text("valence \(v >= 0 ? "+\(v)" : "\(v)")")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack { BeliefsListView() }
}
