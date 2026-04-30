import Foundation

/// On-device trading game state. The user opens with $10,000 of fake cash and
/// can buy long ("underrated") or short ("overrated") any belief whose
/// `/api/beliefs/[id]` response carries a usable score. Persisted as JSON in
/// `UserDefaults` under `ISEPortfolio` — see `PortfolioStore.swift`.
///
/// Mirrors `android/.../model/Trading.kt` so the two platforms stay in sync.

enum Side: String, Codable, Hashable {
    case long = "LONG"
    case short = "SHORT"
}

enum TradeAction: String, Codable, Hashable {
    case open = "OPEN"
    case close = "CLOSE"
}

struct Position: Codable, Identifiable, Hashable {
    let id: String
    let beliefId: Int
    let statement: String
    let side: Side
    let shares: Int
    let openPrice: Double
    let openedAt: Date

    func unrealizedPnL(mark: Double) -> Double {
        switch side {
        case .long:  return Double(shares) * (mark - openPrice)
        case .short: return Double(shares) * (openPrice - mark)
        }
    }
}

struct TradeEvent: Codable, Identifiable, Hashable {
    let id: String
    let timestamp: Date
    let beliefId: Int
    let statement: String
    let side: Side
    let action: TradeAction
    let shares: Int
    let price: Double
    let realizedPnL: Double

    init(
        id: String = UUID().uuidString,
        timestamp: Date,
        beliefId: Int,
        statement: String,
        side: Side,
        action: TradeAction,
        shares: Int,
        price: Double,
        realizedPnL: Double = 0
    ) {
        self.id = id
        self.timestamp = timestamp
        self.beliefId = beliefId
        self.statement = statement
        self.side = side
        self.action = action
        self.shares = shares
        self.price = price
        self.realizedPnL = realizedPnL
    }
}

struct Portfolio: Codable, Hashable {
    static let startingCash: Double = 10_000.0

    var cash: Double = Portfolio.startingCash
    var positions: [Position] = []
    var realizedPnL: Double = 0
    var history: [TradeEvent] = []

    /// Mark-to-market value if every open position closed at `marks[beliefId]`.
    /// Positions whose price isn't known yet fall back to their open price
    /// (i.e. zero P&L), so the equity reading degrades gracefully on a network
    /// failure rather than blanking out.
    func equity(marks: [Int: Double]) -> Double {
        let open = positions.reduce(0.0) { sum, p in
            let mark = marks[p.beliefId] ?? p.openPrice
            switch p.side {
            case .long:
                return sum + Double(p.shares) * mark
            case .short:
                // Shorts: we hold the original sale proceeds plus any decline.
                return sum + Double(p.shares) * (2 * p.openPrice - mark)
            }
        }
        return cash + open
    }
}

/// Treat the strength-adjusted score (preferred, 0–1) or the overall score
/// (-100..100 fallback) as a signal and convert to a per-share dollar price.
/// A 1¢ floor keeps math sane when a belief's score is missing or negative.
/// Returns nil if neither score is present so the UI can disable trading.
func priceFromScore(strengthAdjusted: Double?, overall: Double?) -> Double? {
    guard let raw = strengthAdjusted ?? overall else { return nil }
    return max(raw * 100.0, 0.01)
}
