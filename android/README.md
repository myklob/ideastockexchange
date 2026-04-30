# Idea Stock Exchange — Android app

Native Android shell that mirrors `ios/`: a Jetpack Compose four-tab app over
the deployed Idea Stock Exchange API, with a built-in fake-money trading game
on top.

- **Browse** — native list/detail that traverses *Reasons to Agree* and
  *Reasons to Disagree* via `/api/beliefs` and `/api/beliefs/[id]`. Each
  argument shows its impact, linkage, and importance scores; tapping it
  navigates into the child belief so the user can recursively walk the reason
  graph. The detail screen also surfaces the Cost-Benefit Analysis (benefits,
  costs, and their likelihoods) and any Impact / Risks fields. From any
  loaded belief the user can **Buy (Long)** or **Short** at the current
  market price (derived from the strength-adjusted or overall score).
- **Portfolio** — every player starts with **$10,000** of fake cash. This
  tab shows current equity, realized + unrealized P&L, cash on hand, every
  open position marked-to-market against the latest API score, and a close
  button per position. There's a "Reset" affordance to wipe state and start
  fresh. Persisted on-device as JSON in `filesDir/portfolio.json`.
- **Top 10** — leaderboard ranked by net worth (cash + open-position
  mark-to-market). The current player's row is computed live; the other nine
  slots come from a static seed of fictional traders so a fresh install has
  someone to play against. When a real backend leaderboard endpoint exists
  we'll swap the seed list for an HTTP fetch.
- **Web** — `WebView` over the deployed site for everything the native tab
  doesn't yet cover (Values & Interests Analysis, Evidence Ledger, Definitions,
  etc.).

### Trading model

- **Price** = `max(0.01, score × 100)` where `score` is the belief's
  `strengthAdjustedScore` (preferred) or `overallScore`, both 0–1 from the
  API. Beliefs without a score are not tradeable.
- **Long**: buy `n` shares at price `p`. Cash decreases by `n × p`. P&L =
  `n × (mark − p)`.
- **Short**: collateral `n × p` is held. P&L = `n × (p − mark)`. Closing a
  short returns `n × (2p − mark)` — collateral plus the price decline.
- The portfolio file is rewritten atomically (temp + rename) on every trade,
  so a crash mid-write can't corrupt state.

The split exists for the same reason as iOS: Google's Play Store reviewers
sometimes flag pure WebView wrappers under "Repetitive Content" / Minimum
Functionality. The native Browse tab gives reviewers something native to look
at, and seeds the path toward a fully native build later.

For the Trusted Web Activity (TWA) path — which is a separate, simpler way to
ship the existing PWA into the Play Store — see `docs/ANDROID.md`. This
project is the step beyond that.

## Quick start

Prerequisites:

- **Android Studio Iguana 2023.2.1** or newer (it ships AGP 8.5+ and the K2
  Compose compiler plugin used here).
- **JDK 17** (Android Studio bundles it; on the CLI: `brew install openjdk@17`
  on macOS, `apt install openjdk-17-jdk` on Debian).
- **Android SDK platform 35** + build-tools 35.0.0 (Android Studio's SDK
  Manager will install these on first sync).

```bash
cd android
# Open this directory in Android Studio. It will:
#   1. Download Gradle and the Android Gradle Plugin
#   2. Pull AndroidX, Compose, kotlinx.serialization
#   3. Build a debug APK to a connected device or emulator (Shift+F10)

# Or from the CLI, after Android Studio has populated `local.properties`
# with sdk.dir:
./gradlew :app:assembleDebug
```

The APK lands at `app/build/outputs/apk/debug/app-debug.apk`.

## Configuration

The base URL the app talks to defaults to `https://ideastockexchange.com`.
Override it in `android/local.properties` (gitignored):

```
ise.base.url=https://staging.ideastockexchange.com
```

Or pass `-PiseBaseUrl=...` to a Gradle invocation. The chosen value flows into
`BuildConfig.BASE_URL`, which both the Browse tab's API client and the Web
tab's WebView consume — same pattern as `ISEWebURL` in
`ios/Resources/Info.plist`.

## Layout

```
android/
├── settings.gradle.kts            # Project + repositories
├── build.gradle.kts               # Plugin versions
├── gradle.properties
└── app/
    ├── build.gradle.kts           # Application module — versions, deps, BuildConfig
    ├── proguard-rules.pro
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/com/ideastockexchange/app/
        │   ├── MainActivity.kt    # 4-tab shell + Compose nav graph
        │   ├── api/IseApi.kt      # HttpURLConnection-based JSON client
        │   ├── data/
        │   │   ├── PortfolioStore.kt  # Atomic-write JSON store, $10k seed
        │   │   └── Leaderboard.kt     # Top-10 builder + 9 mock seed traders
        │   ├── model/
        │   │   ├── Belief.kt      # @Serializable mirrors of the API shapes
        │   │   └── Trading.kt     # Portfolio, Position, Side, pricing helpers
        │   └── ui/
        │       ├── theme/Theme.kt
        │       ├── list/          # Browseable list of beliefs
        │       ├── detail/        # Pro/con + scores + CBA + impact + Trade bar
        │       ├── trade/         # Buy / Short confirmation dialog
        │       ├── portfolio/     # Equity, positions, P&L, close
        │       ├── leaderboard/   # Top 10 with rank badges
        │       └── web/WebScreen.kt
        └── res/
            ├── values/{strings,colors,themes}.xml
            ├── xml/network_security_config.xml
            └── mipmap-*           # Launcher icons (copied from public/icons/)
```

## Why no committed `.gradle` / wrapper?

The Android Studio sync regenerates `.gradle/`, `local.properties`, and the
Gradle wrapper on first open. Committing them creates merge conflicts on every
SDK or AGP bump. Mirror of the iOS approach (`ios/.gitignore` keeps the
generated `.xcodeproj` out) and the TWA approach in `docs/ANDROID.md` (the
Bubblewrap-generated Android Studio project is not committed either).

If you need a CLI wrapper (e.g. for CI), run once after the first sync:

```bash
./gradlew wrapper --gradle-version 8.9 --distribution-type bin
```

…and commit `gradle/`, `gradlew`, `gradlew.bat`. They're listed in
`.gitignore` by default; remove the entries if you want to keep them.

## Building without Android Studio

You can do a debug build on Linux with just `openjdk-17` and the command-line
Android SDK if you want to. The first `./gradlew :app:assembleDebug` will
download Gradle and AGP per the version pins in `build.gradle.kts` /
`app/build.gradle.kts`.
