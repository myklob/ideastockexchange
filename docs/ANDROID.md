# Android: PWA → Play Store

The plan is incremental. Each step is reversible and testable on its own.

| Step | What it gives you | Time | Status |
|------|-------------------|------|--------|
| 1. Installable PWA | Chrome on Android shows "Install app". Full-screen launch, home-screen icon. | ~2 hours | ✅ Done — see `public/manifest.webmanifest` and the metadata in `src/app/layout.tsx`. |
| 2. TWA wrapper for Play Store | Real Play Store listing. The "app" is a 100-line Android shell that opens your URL with no browser chrome. Update the web app, the shell auto-updates with it. | 1–2 days | 🟡 Scaffold ready (this doc + `public/.well-known/assetlinks.json`); waits on a deployed URL. |
| 3. React Native rebuild | Native UI/perf, share scoring engine via a workspace package. Dual maintenance. | 3–6 months | ⏸ Don't start until path 2 is shipped and you have usage data. |

## Step 2 in detail: Trusted Web Activity via Bubblewrap

[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) is Google's official CLI for generating TWAs. It reads your web manifest and emits an Android Studio project you can build and sign. We don't commit the generated project — it's a build artifact derived from `manifest.webmanifest`.

### Prerequisites

1. **HTTPS deployment.** TWAs only verify against an HTTPS URL. Vercel, Cloudflare Pages, Fly, or Render all work. Local `next dev` does not.
2. **Java 17** and **Android SDK** (Bubblewrap will offer to install both).
3. **Google Play Console developer account** ($25 one-time).
4. **Stable package name.** We default to `com.ideastockexchange.twa` (matches `assetlinks.json`). Change it in *one* place — the assetlinks file *and* the Bubblewrap init flow — or the chrome bar will reappear because verification fails.

### Generate the Android project

```bash
# From a clean directory outside this repo (the generated project is large)
mkdir -p ~/projects/ise-android && cd ~/projects/ise-android

# Read the deployed manifest and scaffold an Android project
npx @bubblewrap/cli init \
  --manifest=https://YOUR_DEPLOYED_DOMAIN/manifest.webmanifest

# Bubblewrap will prompt for: package name, app name, signing key, etc.
# Use the same package name that's in public/.well-known/assetlinks.json.

# Build a debug APK to test on a device
npx @bubblewrap/cli build
```

### Wire up Digital Asset Links (the part everyone forgets)

Android verifies that your APK is allowed to render `your-domain.com` without browser chrome by fetching `https://YOUR_DEPLOYED_DOMAIN/.well-known/assetlinks.json`. If verification fails, the user sees the URL bar — defeating the whole point.

This repo already serves the file from `public/.well-known/assetlinks.json` (Next.js serves `public/` verbatim). You need to fill in **one** value:

1. After `bubblewrap init` generates a keystore, get its SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore android.keystore -alias android | grep "SHA-256"
   ```
   Or, more simply:
   ```bash
   npx @bubblewrap/cli fingerprint
   ```
2. Paste the fingerprint into `public/.well-known/assetlinks.json`, replacing `REPLACE_WITH_KEYSTORE_SHA256_FINGERPRINT`.
3. Deploy. Verify the file is reachable:
   ```bash
   curl https://YOUR_DEPLOYED_DOMAIN/.well-known/assetlinks.json
   ```
4. If your host strips `.well-known/` (some do), add a rewrite in `next.config.ts` or the host's config so the file actually serves.

### Test on a real device

```bash
# With an Android phone in developer mode connected via USB:
adb install ~/projects/ise-android/app-release-signed.apk
```

Open the app. If you see no URL bar, asset linking worked. If you see the URL bar, recheck the fingerprint and the file's reachability.

### Ship to the Play Store

1. `npx @bubblewrap/cli build --release` produces `app-release-bundle.aab`.
2. Upload the AAB to the Play Console under "Internal testing" first.
3. Fill in screenshots, description, content rating, privacy policy URL.
4. Promote internal testing → closed testing → production over a few days.

First-time review takes 4–7 days. Updates take 1–3 days. Your web app keeps deploying normally; the AAB only needs to change when you bump version codes or alter the Android-side config.

## When to consider step 3 (React Native or native Kotlin)

Honest signals you've outgrown the PWA path:
- Cold-start time > 3 seconds even after caching tuned.
- You need real push notifications with rich payloads (TWAs support web push, but it's clunkier than native FCM).
- You need device features the web platform can't reach (Bluetooth LE, NFC, deep camera control).
- You want platform features that require a native shell (App Shortcuts, Quick Settings tiles, Wear OS).

If none of those bite, stay on the PWA + TWA. The two-codebase tax of going native is a real cost; don't pay it for status reasons.

## Cost recap

| | DIY | Freelance | Agency |
|---|---|---|---|
| Step 1 (PWA) | Done | n/a | n/a |
| Step 2 (TWA) | $25 Play fee + ~1 day | $1–3k | $3–8k |
| Step 3 (RN rebuild) | 3–6 months | $30–80k | $100–200k |
| Step 4 (native Kotlin) | 6–12 months | $80–200k | $200–500k+ |
