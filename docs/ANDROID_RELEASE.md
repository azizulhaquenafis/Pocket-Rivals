# Android build and Google Play preparation

Status as of **2026-10-13**: Capacitor Android project generated and configured. Java/Android SDK are unavailable on this workstation; native compilation, emulator execution and device testing remain outstanding. No publication has been attempted.

## Toolchain

Install Android Studio **Otter 2025.2.1 or newer**, its bundled JDK 21, Android SDK Platform 36, Android SDK Build-Tools, command-line tools, and platform tools. Accept Android SDK licenses through Android Studio. Use Node 22.21.1+ and `npm ci`.

On macOS, if the shell cannot find Android Studio's Java runtime:

```sh
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

Android Studio can write `android/local.properties` with your SDK path; this file is ignored and must not be committed. Do not change the repository's Gradle wrapper to an unrelated globally installed Gradle.

## Debug APK

```sh
npm ci
npm test
npm run build
npm run test:browser
npm run android:debug
```

Install `android/app/build/outputs/apk/debug/app-debug.apk` on a device, or use:

```sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

After adding/changing games, repeat `npm run android:debug`; it rebuilds the web app and synchronizes the bundled assets before compiling. Debug and release assets have no development-server URL configured.

## Identity and versions

- Proposed application ID / Java namespace: `com.pocketrivals.games`.
- Display name: **Pocket Rivals**.
- Android minimum API: **24**; compile and target API: **36**.
- Default Android versionCode: **1**; versionName: **0.1.0**.
- Web package version: `package.json`.

Before the first Play upload, confirm ownership/availability of the identity and name. If changing the ID, update `capacitor.config.ts`, `android/app/build.gradle`, strings `package_name` and `custom_url_scheme`, and the Java package declaration/directory under `android/app/src/main/java`. This identity becomes permanent for an existing Play listing.

Override versions for each release through Gradle project properties:

```sh
export ORG_GRADLE_PROJECT_appVersionCode=2
export ORG_GRADLE_PROJECT_appVersionName=0.1.1
npm run android:release
```

Every Play upload needs a higher integer versionCode. Keep the displayed version in `package.json` and the settings UI in sync with versionName.

## Signing without repository secrets

Use **Google Play App Signing**. Play protects the distribution signing key; sign uploaded AABs with your separate upload key. Create the upload key outside this repository (the command prompts for passwords):

```sh
keytool -genkeypair -v -keystore /absolute/private/path/pocket-upload.jks \
  -alias pocket-upload -keyalg RSA -keysize 3072 -validity 10000
```

Provide the following environment variables through your secret manager or an interactive shell. Never paste real values into documentation, chat, shell history, or source:

- `POCKET_KEYSTORE`: absolute path to the upload keystore.
- `POCKET_STORE_PASSWORD`: keystore password.
- `POCKET_KEY_ALIAS`: alias, e.g. `pocket-upload`.
- `POCKET_KEY_PASSWORD`: private-key password.

Then run `npm run android:release`. Release tasks fail with a clear message if any signing value is missing. They never silently use a debug key. Output: `android/app/build/outputs/bundle/release/app-release.aab`. Back up the upload key securely and use CI secret storage if you automate releases. Keystores and `.env` files are ignored.

## Target SDK and native behavior

Google Play's current published requirement for new standard Android apps and updates is **Android 16 / API 36 or higher**. This project targets 36. Recheck the policy at submission; meeting target SDK alone is not full Play compliance.

Sources checked 2026-10-13:

- [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-EN).
- [Capacitor 8 Android toolchain and API requirements](https://capacitorjs.com/docs/updating/8-0).
- [Google Play App Signing](https://developer.android.com/studio/publish/app-signing).

The manifest requests no app permissions, removes the template's internet permission and FileProvider, disables backup, and disallows cleartext traffic. No billing/ads/networking plugins are included. Capacitor serves packaged files through its local WebView bridge. Verify the final merged manifest after a native build to confirm library contributions. Test Android 16 edge-to-edge/safe-area behavior on hardware; the layout consumes Capacitor's CSS inset variables. Native phones request portrait; tablets/adaptive windows may ignore orientation restrictions, so the game also fits landscape containers.

The app pauses on `appStateChange`, browser visibility loss, and window blur. Android Back pauses gameplay; another Back resumes. Back from results returns to the menu. At the main menu it presents a close/stay dialog. No active game progresses while backgrounded.

## Publisher release checklist

- [ ] Install toolchain; build debug APK; install on at least two physical Android devices.
- [ ] Test two real fingers from opposite ends: small/large phones, edge gestures, touch cancellation, and three simultaneous contacts.
- [ ] Play all three games to completion; test goals near posts/rails, high-speed hits and repeated rematches.
- [ ] Measure frame times and touch responsiveness on a typical lower/mid-range Android device. The 60 FPS target is not a measured device guarantee yet.
- [ ] Test Home/lock/unlock, system Back, interruptions, audio focus, screen rotation, notches, gesture/button navigation and tablets.
- [ ] Test installation and full play in airplane mode. Verify scores after restart and after app update. Uninstall/clear-data intentionally removes scores.
- [ ] Check merged manifest, release dependency graph, Android lint, release logs and App Bundle contents. Check any transitive native libraries for 16 KB page-size support; none are intentionally added by the game.
- [ ] Confirm brand/package identity; retain font/dependency licenses and original artwork records.
- [ ] Set unique versionCode/versionName; sign the AAB with a securely stored upload key; enroll in Play App Signing.
- [ ] Use internal/closed testing, Play pre-launch reports, and any current testing prerequisites for the publisher's account.
- [ ] Prepare screenshots, 512 px store icon and 1024×500 feature graphic from the final product; do not reuse reference-game images.
- [ ] Complete content rating, target audience, Data safety, advertising declaration (none), and a public privacy-policy URL after adding the publisher's contact information.
- [ ] Obtain the publisher's explicit approval before any store submission or paid account creation.
