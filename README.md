# Radio & Podcast Player (React Native CLI + Native Modules)

> Cross-platform mobile audio player for live internet radio stations and RSS podcasts engineered with **React Native CLI**, strict **TypeScript**, **Feature-Sliced Design (FSD)** architecture, persistence via **WatermelonDB (JSI SQLite)**, an offline resumable downloader with byte-range requests (`HTTP Range`), and custom native **StreamGuard** modules in **Kotlin (Android)** and **Swift (iOS)** for stream recovery.

---

## Technology Stack

* **Platform**: React Native CLI (`0.76.6`), React 18.3.1, strict TypeScript (`noImplicitAny`, `strictNullChecks`).
* **Native Modules**:
  * **Android**: Kotlin (`StreamGuardModule.kt`), `ConnectivityManager.NetworkCallback`, Android Foreground Service (`mediaPlayback`), `PowerManager` (Doze mode exemption).
  * **iOS**: Swift (`StreamGuardModule.swift`), `NWPathMonitor`, `AVAudioSession`, `MPNowPlayingInfoCenter`, `MPRemoteCommandCenter`.
* **Audio Engine**: `react-native-track-player` (v4.1.2) extended with a custom native recovery and control layer.
* **Database**: `@nozbe/watermelondb` (v0.28.0) with JSI SQLite adapter (`jsi: true`) and built-in `database.localStorage`.
* **File & Download Management**: `react-native-blob-util` (HTTP 206 Partial Content, segmented chunk resumption).
* **State Management**: `zustand` (v5.0.16) for global playback state, queue, station filters, and download tasks.
* **Free & Keyless APIs**:
  * **Radio**: [Radio Browser API](https://www.radio-browser.info/) (community-driven mirrored global radio directory).
  * **Podcasts**: Open standard RSS/XML feeds (parsed via `fast-xml-parser`).

---

## Features

* **Live Radio Catalog**: Debounced search (350ms), country, genre, and codec filters, one-tap favorite toggling.
* **Podcast Subscriptions via RSS**: XML feed parser supporting iTunes namespace, episode pagination, quick preset buttons.
* **Background Playback**: Persistent audio execution across app minimization, screen locking, and multitasking.
* **Lock Screen & Notification Controls**:
  * **Android**: System `MediaStyle Notification` with Play, Pause, +/-30s seek, Next, Previous, artwork, and metadata.
  * **iOS**: Integration with `MPNowPlayingInfoCenter` and Control Center.
* **Playback Queue**: Automatic queue generation for stations and podcast episodes, with reordering and removal.
* **Resumable Offline Podcast Downloads**:
  * Byte-range resumption via `Range: bytes=X-` headers and `.part` files.
  * Real-time progress monitoring.
  * Offline playback in Airplane mode without network connectivity.
* **Throttled Episode Progress Persistence**:
  * SQLite writes throttled to 15-second intervals during active playback.
  * Instant flush on pause, track change, or background transition.
  * Automatic cold-start resumption of the most recent in-progress episode.
* **Persistent Playback Volume**:
  * Volume level managed via `usePlayerStore` and persisted in `database.localStorage`.
  * Preserves user preference without resetting to 100% on track change or app restart.
* **Sleep Timer**: Presets for 1, 5, 10, and 25 minutes with clean playback termination.
* **Variable Playback Speed**: Speed presets (0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 1.75x, 2.0x) for podcast episodes.

---

## Architecture Overview (Feature-Sliced Design)

The codebase strictly follows Feature-Sliced Design (FSD) unidirectional layer hierarchy (`app -> pages -> widgets -> features -> entities -> shared`):

```text
src/
├── app/
│   ├── AppRoot.tsx          # Application root container and theme provider
│   ├── navigation/          # RootNavigator (stack) and TabNavigator (bottom tabs)
│   ├── providers/           # DatabaseProvider, PlayerProvider
│   └── services/            # playbackService.ts (Headless JS track-player event handler)
├── pages/
│   ├── radio-catalog/       # Radio station browser, search, filters, recovery banner
│   ├── podcasts-feed/       # Podcast subscriptions, RSS feed intake, presets
│   ├── podcast-details/     # Episode list, offline download triggers, queue actions
│   ├── downloads/           # Offline downloads manager, cache stats, cleanup
│   └── player-modal/        # Full-screen modal player screen
├── widgets/
│   ├── mini-player/         # Persistent bottom playback bar with progress display
│   ├── full-player/         # Comprehensive player (scrubber, volume, sleep timer, queue)
│   ├── queue-sheet/         # Interactive queue management bottom sheet
│   └── station-list/        # Virtualized station list component
├── features/
│   ├── filter-stations/     # Radio filtering by name, country, genre tags
│   ├── subscribe-rss/       # XML RSS parser, batch database persistence
│   ├── download-episode/    # Segmented .part downloader, HTTP Range resume, 2GB LRU cache
│   ├── playback-controls/   # Transport actions and playback speed control
│   ├── sleep-timer/         # Scheduled sleep timer mechanism
│   └── stream-recovery/     # UI coordinator for native StreamGuard events
├── entities/
│   ├── station/             # Station domain model, Radio Browser client, favorites
│   ├── podcast/             # Podcast entity, WatermelonDB queries
│   ├── episode/             # Episode entity, 15-second throttled progress persistence
│   └── player/              # Global playback store and TrackPlayer controller
└── shared/
    ├── api/                 # Timeout-safe network utilities (fetchTextWithTimeout)
    ├── config/              # Environment constants, API mirrors, navigation route types
    ├── db/                  # WatermelonDB schema, models (Podcast, Episode, Favorite), migrations
    ├── lib/                 # StreamGuard bridge declarations, throttle utility, formatters
    └── ui/                  # Design system primitives (ScreenContainer, Artwork, PlayPauseButton)
```

---

## Technical Implementations & Challenges

### 1. Android Foreground Service & Audio Focus
* **Service Lifecycle**: Declares `foregroundServiceType="mediaPlayback"` in `AndroidManifest.xml` alongside `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, and `WAKE_LOCK`.
* **MediaSessionCompat**: Dispatches live metadata, dynamic artwork, and playback states directly to the OS media subsystem.
* **Audio Focus (`RemoteDuck`)**:
  * Ducking interruptions (turn-by-turn navigation, system alerts) temporarily attenuate playback volume and restore it to the user's saved level.
  * Transient loss (phone calls, alarms) pauses playback and records pre-interruption state.
* **AUDIO_BECOMING_NOISY**: Automatically halts playback when wired headphones or Bluetooth devices disconnect.

### 2. Custom Native Module: StreamGuard (Kotlin & Swift)
* Implemented as a native module on **Android** (`StreamGuardModule.kt`) and **iOS** (`StreamGuardModule.swift`), exposed through React Native Bridge (`ReactContextBaseJavaModule` / `RCTEventEmitter`).
* Operates on background dispatchers (`Dispatchers.IO` / `DispatchQueue.utility`) without blocking the Main UI Thread.
* Leverages `ConnectivityManager.NetworkCallback` (Android) and `NWPathMonitor` (iOS) to detect interface transitions (`Wi-Fi <-> Cellular`) and network loss.
* Emits `StreamGuardNetworkState` and `StreamGuardRecoveryStatus` events to JavaScript.

### 3. Live Radio Stream Resilience
* **Continuous Stream Handling**: Unlike static audio files, radio streams are infinite. Stream drops transition the player into a non-blocking recovery phase instead of triggering fatal errors.
* **Exponential Backoff**: StreamGuard coordinates reconnect attempts with intervals of `1s -> 2s -> 4s -> 8s -> 16s -> 30s` (up to 12 attempts).
* **Interface Switching**: When a device transitions between Wi-Fi and mobile networks, StreamGuard detects the interface change and signals the player to re-establish the socket connection seamlessly.
* **Watchdog Protection**: A 25-second connection watchdog detects hung buffers and automatically falls back to secondary station URLs (`fallbackStreamUrl`).

### 4. Resilient RSS Feed Ingestion
* Uses `fast-xml-parser` with namespace-agnostic attribute extraction to reliably ingest diverse RSS dialect variants (`itunes:`, `content:`).
* Handles unescaped CDATA blocks, strips embedded HTML markup, and decodes HTML entities in episode descriptions.
* Validates `<enclosure>` media URLs and sizes prior to database insertion.
* Executes chunked batch writes into SQLite via `database.batch(...)` in segments of 50 records to prevent UI thread frame drops on 500+ episode feeds.

### 5. Segmented Download Engine & LRU Cache
* Downloads audio files into the private application directory `<DocumentDir>/episodes_cache` using `react-native-blob-util`.
* Pausing and resuming downloads leverages byte offsets with `Range: bytes={existingBytes}-` headers, handling HTTP `206 Partial Content`.
* Enforces a **2 GB** storage ceiling with **Least Recently Used (LRU)** eviction: the oldest, fully played episodes are evicted first when the ceiling is reached.
* Cascade deletion: unsubscribing from a podcast automatically removes all associated audio files from disk.

### 6. Throttled Database Synchronization
* Progress synchronization during active playback is guarded by a custom throttle (`createThrottle`) operating at a **15-second** frequency.
* Immediate flushing occurs on pause, track switch, stop, and when the app transitions to the background.
* Volume preferences are written to `database.localStorage` (`playback_volume`), ensuring retention across app sessions.

### 7. iOS Media Subsystem Integration
* Background audio execution declared via `UIBackgroundModes: audio` in `Info.plist`.
* `NSAppTransportSecurity` configured to allow HTTP/HTTPS streaming media via `NSAllowsArbitraryLoadsForMedia`.
* Integrated with Control Center and lock screen transport controls through `react-native-track-player`.

---

## OEM Battery Optimization & Background Execution Limitations

While standard Android (AOSP / Pixel) honours Foreground Services displaying a persistent notification, proprietary third-party Android skins enforce aggressive background execution limiters that may terminate sockets or freeze processes when the screen is locked:

### 1. Xiaomi / Redmi / POCO (MIUI / HyperOS)
* **Root Cause**: Xiaomi's `PowerKeeper` daemon overrides standard Android process priorities and kills background tasks after 5–10 minutes of screen-off time or drops sockets during Wi-Fi/Cellular handoff.
* **Required User Configuration**:
  1. Navigate to **Settings -> Apps -> Manage apps -> RadioPodcastPlayer**.
  2. Enable **Autostart** (Background autostart).
  3. Under **Battery saver**, select **No restrictions**.
  4. In the Recent Apps tray, long-press the application card and tap the **Lock** icon to prevent task killing.

### 2. Huawei / Honor (EMUI / MagicOS)
* **Root Cause**: The proprietary `SmartOptimizer` and `HwPFW` subsystems terminate non-whitelisted processes upon screen lock.
* **Required User Configuration**:
  1. Navigate to **Settings -> Battery -> App launch**.
  2. Locate **RadioPodcastPlayer** and disable **Manage automatically**.
  3. Enable all three manual toggles: **Auto-launch**, **Secondary launch**, and **Run in background**.

### 3. Samsung (OneUI)
* **Root Cause**: Samsung's `Device Care` (`MARs`) moves applications to "Sleeping apps" or restricts background network traffic.
* **Required User Configuration**:
  1. Navigate to **Settings -> Apps -> RadioPodcastPlayer -> Battery**.
  2. Select **Unrestricted**.
  3. Verify the app is added under **Settings -> Battery -> Background usage limits -> Never sleeping apps**.

> **StreamGuard** includes a built-in helper `requestIgnoreBatteryOptimizations()` that invokes the system intent `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, allowing users to whitelist the app from standard Android battery optimization.

---

## Build & Run Guide

### Requirements
* **Node.js**: `>= 18.x`
* **Java Development Kit**: JDK 17 (Azul Zulu or OpenJDK 17)
* **Android**: Android Studio, Android SDK Platform 35, NDK `26.1.10909125`
* **iOS (macOS only)**: Xcode 15+, CocoaPods

### Setup Steps:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run TypeScript check & unit tests**:
   ```bash
   npx tsc --noEmit
   npm test
   ```

3. **Start Metro Bundler**:
   ```bash
   npx react-native start
   ```

4. **Run on Android**:
   ```bash
   npx react-native run-android --no-packager
   ```

5. **Run on iOS**:
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios --no-packager
   ```

---

## Verification Checklist

* [x] **Background Playback**: Audio continues playing uninterrupted when minimized and screen locked.
* [x] **Lock Screen & Notification Controls**: Play/Pause, track skipping, and seek operations function as expected.
* [x] **Audio Focus**: System alerts and calls duck or pause playback, with restoration upon completion.
* [x] **Stream Recovery**: Network drops and interface switches (`Wi-Fi <-> Cellular`) recover without manual intervention.
* [x] **Offline Mode**: Downloaded podcast episodes play back reliably in Airplane mode.
* [x] **State Persistence**: Playback position and volume levels survive track switches and application cold starts.
* [x] **Documentation**: Complete English architecture guide, native module specs, Doze mode handling, and OEM battery constraints.
