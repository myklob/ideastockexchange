import Foundation
import Combine

/// Persists the user's $10k trading game state to a single JSON blob in
/// `UserDefaults`. Single shared instance per process — `PortfolioStore.shared`
/// — so every screen sees the same snapshot.
///
/// `@Published` `portfolio` makes SwiftUI views reactive: any view holding an
/// `@ObservedObject` reference re-renders when cash or positions change.
///
/// Mirrors `android/.../data/PortfolioStore.kt` (which uses a JSON file +
/// coroutine mutex). On iOS, UserDefaults writes are atomic enough for the
/// volume we're dealing with — a few KB at most.
final class PortfolioStore: ObservableObject {
    static let shared = PortfolioStore()

    private static let storageKey = "ISEPortfolio.v1"
    private static let maxHistory = 200

    @Published private(set) var portfolio: Portfolio

    private let defaults: UserDefaults
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        self.encoder = encoder

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder

        if let data = defaults.data(forKey: Self.storageKey),
           let loaded = try? decoder.decode(Portfolio.self, from: data) {
            self.portfolio = loaded
        } else {
            self.portfolio = Portfolio()
        }
    }

    // MARK: - Mutations

    enum TradeResult {
        case opened(Position)
        case closed(realizedPnL: Double)
        case error(String)
    }

    @discardableResult
    func openPosition(
        beliefId: Int,
        statement: String,
        side: Side,
        shares: Int,
        price: Double,
        now: Date = Date()
    ) -> TradeResult {
        guard shares > 0 else {
            return .error("Enter at least 1 share.")
        }
        guard price > 0 else {
            return .error("This belief doesn't have a tradeable price yet.")
        }
        let cost = Double(shares) * price
        if cost > portfolio.cash {
            return .error(String(
                format: "Not enough cash. Need $%.2f, have $%.2f.",
                cost, portfolio.cash
            ))
        }

        var next = portfolio
        let position = Position(
            id: UUID().uuidString,
            beliefId: beliefId,
            statement: statement,
            side: side,
            shares: shares,
            openPrice: price,
            openedAt: now
        )
        next.cash -= cost
        next.positions.append(position)
        next.history = trimmed(next.history + [TradeEvent(
            timestamp: now,
            beliefId: beliefId,
            statement: statement,
            side: side,
            action: .open,
            shares: shares,
            price: price
        )])

        commit(next)
        return .opened(position)
    }

    @discardableResult
    func closePosition(
        positionId: String,
        markPrice: Double,
        now: Date = Date()
    ) -> TradeResult {
        guard let position = portfolio.positions.first(where: { $0.id == positionId }) else {
            return .error("That position is no longer open.")
        }
        guard markPrice > 0 else {
            return .error("No live price to close at.")
        }

        let proceeds: Double = {
            switch position.side {
            case .long:
                return Double(position.shares) * markPrice
            case .short:
                return Double(position.shares) * (2 * position.openPrice - markPrice)
            }
        }()
        let realized = position.unrealizedPnL(mark: markPrice)

        var next = portfolio
        next.cash += proceeds
        next.realizedPnL += realized
        next.positions.removeAll { $0.id == positionId }
        next.history = trimmed(next.history + [TradeEvent(
            timestamp: now,
            beliefId: position.beliefId,
            statement: position.statement,
            side: position.side,
            action: .close,
            shares: position.shares,
            price: markPrice,
            realizedPnL: realized
        )])

        commit(next)
        return .closed(realizedPnL: realized)
    }

    func reset() {
        commit(Portfolio())
    }

    // MARK: - Persistence

    private func commit(_ next: Portfolio) {
        portfolio = next
        if let data = try? encoder.encode(next) {
            defaults.set(data, forKey: Self.storageKey)
        }
    }

    private func trimmed(_ events: [TradeEvent]) -> [TradeEvent] {
        guard events.count > Self.maxHistory else { return events }
        return Array(events.suffix(Self.maxHistory))
    }
}
