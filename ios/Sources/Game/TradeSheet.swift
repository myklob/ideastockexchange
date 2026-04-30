import SwiftUI

/// Buy/Short modal. Opened from the belief detail screen when the user taps
/// the Buy or Short button on the trade bar. Mirrors the Android `TradeDialog`
/// so the two platforms feel identical at this critical step.
struct TradeSheet: View {
    let statement: String
    let side: Side
    let pricePerShare: Double
    let cashAvailable: Double
    let onConfirm: (Int) -> Void
    let onCancel: () -> Void

    @State private var sharesText: String = "1"

    private var shares: Int {
        max(0, Int(sharesText) ?? 0)
    }

    private var cost: Double { Double(shares) * pricePerShare }

    private var canConfirm: Bool {
        shares > 0 && cost <= cashAvailable && pricePerShare > 0
    }

    private var maxAffordable: Int {
        guard pricePerShare > 0 else { return 0 }
        return Int(cashAvailable / pricePerShare)
    }

    private var tint: Color { side == .long ? .green : .red }
    private var verb: String { side == .long ? "Buy" : "Short" }
    private var rationale: String {
        side == .long
            ? "You think this idea is underrated and its score will rise."
            : "You think this idea is overrated and its score will fall."
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(statement)
                        .font(.body.weight(.semibold))
                        .fixedSize(horizontal: false, vertical: true)
                    Text(rationale)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Price / share")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("$\(pricePerShare, specifier: "%.2f")")
                                .font(.headline)
                                .monospacedDigit()
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("Cash")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("$\(cashAvailable, specifier: "%.2f")")
                                .font(.headline)
                                .monospacedDigit()
                        }
                    }
                    .padding(.vertical, 4)
                }
                .listRowBackground(tint.opacity(0.08))

                Section {
                    HStack {
                        Text("Shares")
                        Spacer()
                        TextField("0", text: $sharesText)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .monospacedDigit()
                            .onChange(of: sharesText) { _, newValue in
                                let digits = newValue.filter(\.isNumber)
                                if digits != newValue {
                                    sharesText = String(digits.prefix(6))
                                } else if digits.count > 6 {
                                    sharesText = String(digits.prefix(6))
                                }
                            }
                    }
                    HStack {
                        Text("Cost")
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("$\(cost, specifier: "%.2f")")
                            .monospacedDigit()
                            .foregroundStyle(cost > cashAvailable ? .red : .primary)
                    }
                    .font(.footnote)
                    HStack {
                        Text("Max affordable")
                            .foregroundStyle(.secondary)
                        Spacer()
                        Button("Use max") {
                            sharesText = String(maxAffordable)
                        }
                        .font(.footnote.weight(.semibold))
                        .disabled(maxAffordable < 1)
                        Text("\(maxAffordable)")
                            .monospacedDigit()
                            .foregroundStyle(.secondary)
                    }
                    .font(.footnote)
                }
            }
            .navigationTitle("\(verb) position")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onCancel)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        if canConfirm { onConfirm(shares) }
                    } label: {
                        Text("\(verb) \(shares)")
                            .fontWeight(.semibold)
                    }
                    .disabled(!canConfirm)
                    .tint(tint)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

#Preview {
    TradeSheet(
        statement: "Adopting algorithm X reduces error rates by 30%.",
        side: .long,
        pricePerShare: 42.50,
        cashAvailable: 9_500,
        onConfirm: { _ in },
        onCancel: {}
    )
}
