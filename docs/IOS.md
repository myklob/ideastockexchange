# iOS: PWA → App Store

The plan mirrors `docs/ANDROID.md`. Each step is reversible and shippable on its own; you don't have to commit to native rebuild to get a real App Store listing.

| Step | What it gives you | Time | Status |
|------|-------------------|------|--------|
| 1. Installable PWA on Safari | Add to Home Screen launches full-screen, with the manifest icon. iOS users get most of the value before any App Store work. | done | ✅ Same `public/manifest.webmanifest` and `<meta>` tags in `src/app/layout.tsx` already serve iOS. |
| 2. WKWebView wrapper for App Store | A real App Store listing. The "app" is a thin SwiftUI shell that opens your URL in `WKWebView` with no Safari chrome. The web app keeps deploying normally; the IPA only needs to change for version bumps or shell config. | 1–2 days | 🟡 Scaffold under `ios/` (this doc + `public/.well-known/apple-app-site-association`); waits on a deployed HTTPS URL and an Apple Developer account. |
| 3. SwiftUI native rebuild | Native UI, push notifications via APNs, real native list/detail, share extension. The scaffold already includes a starter native "Browse Beliefs" tab so you can grow into this without throwing away the wrapper. | 3–6 months | ⏸ Don't start until step 2 is shipped and you have usage data. |

## Step 2 in detail: WKWebView wrapper

Apple's iOS equivalent of an Android Trusted Web Activity is just a `WKWebView` inside a SwiftUI app. Apple does not have a TWA-style "no chrome unless verified" mode — `WKWebView` always renders without browser chrome by default. Universal Links cover the asset-linking story (deep links from the web go straight into the app instead of Safari).

### Prerequisites

1. **Mac with Xcode 15.4+.** iOS builds require macOS; there is no Linux toolchain. CI builds work via macOS runners (GitHub Actions `macos-14`, etc.).
2. **Apple Developer Program membership** ($99/year). Required for App Store distribution and for signed device builds beyond the 7-day free-tier window.
3. **HTTPS deployment.** Universal Links and AASA fetching only work over HTTPS. Vercel, Cloudflare Pages, Fly, or Render all work. Local `next dev` does not.
4. **Stable bundle identifier.** We default to `com.ideastockexchange.ios` (matches `apple-app-site-association`). If you change it, change it in *both* the AASA file *and* `ios/project.yml`, or Universal Links silently fall back to opening Safari.
5. **XcodeGen** (`brew install xcodegen`) to materialize `IdeaStockExchange.xcodeproj` from `ios/project.yml`. We don't commit the `.xcodeproj` — it's a build artifact (its `pbxproj` is famous for merge conflicts). Same philosophy as not committing the Bubblewrap-generated Android project.

### Generate the Xcode project

```bash
cd ios
xcodegen                       # reads project.yml, emits IdeaStockExchange.xcodeproj
open IdeaStockExchange.xcodeproj
```

In Xcode:

1. Select the `IdeaStockExchange` target → Signing & Capabilities → set **Team** to your Apple Developer team.
2. Build & Run on the iOS Simulator (`Cmd+R`). The shell opens the production URL.
3. To run on a physical device, plug it in and select it as the run destination. First time will require you to trust the developer profile on the device (Settings → General → VPN & Device Management).

### Configure the deployed URL

The production URL is read from `Info.plist` at runtime via the `ISEWebURL` key. Edit `ios/Resources/Info.plist` (or override per-scheme in Xcode) before shipping:

```xml
<key>ISEWebURL</key>
<string>https://YOUR_DEPLOYED_DOMAIN</string>
```

The default in the scaffold points at `https://ideastockexchange.com` — change it to your real domain before submitting.

### Wire up Universal Links (the iOS analogue of assetlinks.json)

iOS verifies that your app is allowed to handle `https://your-domain.com/...` URLs by fetching `https://YOUR_DEPLOYED_DOMAIN/.well-known/apple-app-site-association`. If verification fails, `https://` taps fall back to Safari instead of opening the app.

This repo serves the file from `public/.well-known/apple-app-site-association`. You need to fill in **two** values:

1. Your Apple **Team ID** (10 characters, found at developer.apple.com → Membership). Replace every occurrence of `TEAMID` in `apple-app-site-association`.
2. The bundle identifier, if you changed it from the default `com.ideastockexchange.ios`.

Then deploy and verify:

```bash
# Apple's CDN caches AASA for ~24h. To force a refresh on a device, reinstall the app.
curl -i https://YOUR_DEPLOYED_DOMAIN/.well-known/apple-app-site-association
```

Critical details Apple is strict about:

- **No `.json` extension.** Just `apple-app-site-association`. Next.js will serve it from `public/` verbatim, but make sure your CDN/host doesn't auto-append extensions or strip dotfile-prefixed paths.
- **`Content-Type: application/json`** (some hosts default to `application/octet-stream`, which iOS rejects).
- **Status 200**, no redirects. Vercel and Cloudflare Pages serve `public/` files cleanly; Netlify needs a `_headers` rule to set the content type.

If your host strips `.well-known/`, add a rewrite in `next.config.ts` so the path actually serves.

### Test on a real device

```bash
# Plug in iPhone, select it as run destination in Xcode, Cmd+R.
# Or, after archiving:
xcodebuild -project IdeaStockExchange.xcodeproj -scheme IdeaStockExchange \
           -destination 'generic/platform=iOS' archive \
           -archivePath build/IdeaStockExchange.xcarchive
```

Open the app. Tap an `https://your-domain.com/beliefs/...` link in Messages or Notes — if Universal Links work, the app opens directly. If Safari opens instead, the AASA file isn't being fetched correctly.

### Ship to the App Store

1. In Xcode: Product → Archive (must be on a real device run destination, not the Simulator).
2. Distribute App → App Store Connect → Upload.
3. In App Store Connect, fill in screenshots (iPhone 6.7" + iPhone 6.1" + iPad if you ship iPad), description, keywords, privacy policy URL, App Privacy disclosure ("Data Not Collected" if the wrapper makes no extra calls beyond the website), and content rating.
4. Submit for review.

First-time review takes 24–72 hours. Updates take 24–48 hours. Apple is stricter than Google about WebView-only apps — the App Store guideline 4.2 ("Minimum Functionality") sometimes flags pure web wrappers. Mitigations the scaffold already includes:

- A native **Browse** tab that calls `/api/beliefs` and renders a real native list + detail. This is enough to clear 4.2 in most reviews.
- Native pull-to-refresh and offline error states on the Browse tab.
- Universal Links so the app handles its own domain.

If Apple still rejects under 4.2, expand the native side (push notifications via APNs, share extension, native compose flow) before re-submitting; do not argue with the reviewer.

## When to consider step 3 (full SwiftUI rebuild)

Honest signals:

- WebView cold-start > 2 seconds even after caching is tuned.
- You need rich push notifications with action buttons (web push on iOS only landed in 16.4 and is still limited).
- You need Apple platform features the web can't reach: Live Activities, widgets, App Intents, Shortcuts, Handoff, ShareExtension, native scroll perf at 120Hz on ProMotion.
- You want to be on iPad with a multi-pane layout, or watchOS / visionOS.

If none of those bite, stay on the wrapper. The two-codebase tax of going fully native is real; don't pay it for status reasons. The native-stub tab in the scaffold gives you a place to grow into native incrementally without committing to a rewrite.

## Cost recap

| | DIY | Freelance | Agency |
|---|---|---|---|
| Step 1 (PWA on iOS Safari) | Done | n/a | n/a |
| Step 2 (WKWebView wrapper) | $99 Apple fee + ~1 day | $1–3k | $3–8k |
| Step 3 (SwiftUI rebuild) | 3–6 months | $30–80k | $100–200k |
| Cross-platform (RN / Flutter) | shared with Android | $40–100k | $120–250k |

## File map

- `ios/project.yml` — XcodeGen spec. Source of truth for bundle ID, deployment target, capabilities.
- `ios/Sources/App/` — `@main` entry, root TabView. Tabs: **Web** (WKWebView) and **Browse** (native).
- `ios/Sources/Web/WebViewScreen.swift` — `UIViewRepresentable` over `WKWebView`. Reads `ISEWebURL` from `Info.plist`.
- `ios/Sources/Native/` — native Browse: list of beliefs, detail view that splits arguments into "Reasons to Agree" / "Reasons to Disagree" with each argument's impact score, and a recursive sub-argument view.
- `ios/Resources/Info.plist` — bundle config, deployed URL key, App Transport Security defaults.
- `ios/Resources/Assets.xcassets/` — app icon and accent color slots (placeholders).
- `public/.well-known/apple-app-site-association` — Universal Links manifest. Fill in `TEAMID` before shipping.
