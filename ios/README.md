# Idea Stock Exchange — iOS app

A SwiftUI shell for the Idea Stock Exchange web app. Two tabs:

- **Web** — `WKWebView` pointing at the deployed site. The whole product, exactly as it renders in Safari, with no browser chrome.
- **Browse** — native list/detail that traverses *Reasons to Agree* and *Reasons to Disagree* using the `/api/beliefs` JSON API. Each argument shows its impact and linkage scores; tapping it navigates into the child belief so you can recursively walk the reason graph.

The split exists because Apple's App Store guideline 4.2 ("Minimum Functionality") sometimes flags pure WebView wrappers. The native Browse tab gives reviewers something native to look at, and seeds the path toward a fully native rebuild later (`docs/IOS.md`, step 3).

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
│   │   └── RootView.swift              # TabView shell
│   ├── Web/
│   │   └── WebViewScreen.swift         # WKWebView wrapper with loading + error states
│   └── Native/
│       ├── Models.swift                # Codables for /api/beliefs and /api/beliefs/[id]
│       ├── ISEAPI.swift                # URLSession-based networking
│       ├── BeliefsListView.swift       # Searchable list of beliefs
│       └── BeliefDetailView.swift      # Score banner + Reasons-to-Agree / Reasons-to-Disagree
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
