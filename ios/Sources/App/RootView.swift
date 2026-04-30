import SwiftUI

/// Four-tab shell:
///   - "Browse" is a native list/detail that traverses reasons-to-agree /
///     disagree using the JSON API. Each belief surfaces its costs, benefits,
///     risks, and likelihoods, plus Buy/Short buttons that open positions in
///     the on-device trading game.
///   - "Portfolio" shows the user's $10,000 fake-money account: cash, equity,
///     and every open position with mark-to-market P&L.
///   - "Top 10" is the leaderboard of the highest-net-worth traders.
///   - "Web" hosts a `WKWebView` over the deployed site for the full product.
///
/// The native tabs also clear App Store guideline 4.2 ("minimum
/// functionality") — see ../README.md and docs/IOS.md.
struct RootView: View {
    var body: some View {
        TabView {
            NavigationStack {
                BeliefsListView()
            }
            .tabItem {
                Label("Browse", systemImage: "list.bullet.rectangle")
            }

            NavigationStack {
                PortfolioView()
            }
            .tabItem {
                Label("Portfolio", systemImage: "chart.line.uptrend.xyaxis")
            }

            NavigationStack {
                LeaderboardView()
            }
            .tabItem {
                Label("Top 10", systemImage: "trophy.fill")
            }

            WebViewScreen()
                .tabItem {
                    Label("Web", systemImage: "globe")
                }
        }
    }
}

#Preview {
    RootView()
}
