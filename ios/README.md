# Idea Stock Exchange — iOS app

A SwiftUI shell for the Idea Stock Exchange web app. Four tabs:

- **Browse** — native list/detail that traverses *Reasons to Agree* and *Reasons to Disagree* using the `/api/beliefs` JSON API. Each argument shows its impact, linkage, and importance scores; tapping it navigates into the child belief so you can recursively walk the reason graph. The detail screen also surfaces costs, benefits, risks, and likelihoods, plus **Buy / Short** buttons that open positions in the on-device trading game.
- **Portfolio** — the user's $10,000 fake-money account. Shows cash, equity, realized + unrealized P&L, and every open position with a Close button that closes at the latest fetched mark price. Pull-to-refresh re-fetches each open belief's score.
- **Top 10** — the leaderboard. Net worth = cash + open positions marked to market. The user's row is computed live from the local store; the other nine are seed traders so the screen has comparators on a fresh install.
- **Web** — `WKWebView` pointing at the deployed site. The whole product, exactly as it renders in Safari, with no browser chrome.

The native tabs exist because Apple's App Store guideline 4.2 ("Minimum Functionality") sometimes flags pure WebView wrappers. They give reviewers something native to look at, give users a real reason to install, and seed the path toward a fully native rebuild later (`docs/IOS.md`, step 3).

## Quick start (macOS)

```bash
brew install xcodegen          # one-time, if you don't already have it
cd ios
xcodegen                       # materializes IdeaStockExchange.xcodeproj
open IdeaStockExchange.xcodeproj
```

In Xcode:

1. Select the **IdeaStockExchange** target → *Signing & Capabilities* → set **Team** to your Apple Developer team.
2. Pick an iOS Simulator (e.g. iPhone 15) as the run destination.
3. `Cmd+R` to build and run.

The Web tab loads the URL configured in `Resources/Info.plist` under the `ISEWebURL` key (defaults to `https://ideastockexchange.com`). Edit that value before shipping or override it per scheme. The Browse tab points at the same base URL.

## Layout

```
ios/
├── project.yml                         # XcodeGen spec (source of truth for bundle ID, deployment target, capabilities)
├── Sources/
│   ├── App/
│   │   ├── IdeaStockExchangeApp.swift  # @main entry point
│   │   └── RootView.swift              # 4-tab shell (Browse / Portfolio / Top 10 / Web)
│   ├── Web/
│   │   └── WebViewScreen.swift         # WKWebView wrapper with loading + error states
│   ├── Native/
│   │   ├── Models.swift                # Codables for /api/beliefs and /api/beliefs/[id]
│   │   ├── ISEAPI.swift                # URLSession-based networking
│   │   ├── BeliefsListView.swift       # Searchable list of beliefs
│   │   └── BeliefDetailView.swift      # Score banner + CBA / Impact / arguments + trade bar
│   └── Game/
│       ├── Trading.swift               # Portfolio / Position / Side / pricing
│       ├── PortfolioStore.swift        # UserDefaults-backed ObservableObject store
│       ├── Leaderboard.swift           # Seed traders + Top 10 builder
│       ├── TradeSheet.swift            # Buy / Short modal sheet
│       ├── PortfolioView.swift         # Portfolio tab
│       └── LeaderboardView.swift       # Top 10 tab
└── Resources/
    ├── Info.plist                      # ISEWebURL, ATS, orientations
    ├── IdeaStockExchange.entitlements  # Associated domains for Universal Links
    └── Assets.xcassets/                # AppIcon + AccentColor placeholders
```

## Universal Links

`public/.well-known/apple-app-site-association` (in the web repo, served at the deployed root) routes `/beliefs/*`, `/markets/*`, and `/` through the app once installed. Before shipping:

1. Replace `TEAMID` in `apple-app-site-association` with your real Apple Team ID.
2. Confirm the file serves with `Content-Type: application/json` and HTTP 200 (no redirect).
3. Re-archive and reinstall the app — Apple's CDN caches AASA for ~24h.

Full walkthrough in `docs/IOS.md`.

## Why XcodeGen instead of a committed `.xcodeproj`?

`pbxproj` files merge-conflict on every change to file membership. XcodeGen generates the project from the YAML spec on demand, so reviewable changes stay in `project.yml`. Mirror of the same philosophy in `docs/ANDROID.md`: don't commit Bubblewrap's generated Android Studio project.

## Building without macOS

You can't. iOS apps require Xcode, which is macOS-only. CI runs on `macos-14` GitHub runners (or equivalent). The repository scaffold is editable on Linux but the build step is not.
