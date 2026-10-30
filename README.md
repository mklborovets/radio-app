# Radio & Podcast Player (React Native + Native StreamGuard)

Cross-platform mobile audio player for Android and iOS engineered with React Native CLI, strict TypeScript, Feature-Sliced Design (FSD), WatermelonDB JSI persistence, offline resumable downloads via HTTP Range headers, and a custom native `StreamGuard` module in Kotlin and Swift.

---

## 1. Architecture Overview (Feature-Sliced Design)

The JavaScript codebase strictly follows Feature-Sliced Design (FSD) unidirectional layer boundaries (`app -> pages -> widgets -> features -> entities -> shared`):

```text
src/
├── app/
│   ├── index.tsx
│   ├── navigation/          # RootNavigator, TabNavigator
│   ├── providers/           # DatabaseProvider, PlayerProvider
│   └── services/            # playbackService.ts (Headless JS task)
├── pages/
│   ├── radio-catalog/       # Live radio directory with filters & StreamGuard status
│   ├── podcasts-feed/       # Podcast subscriptions & RSS feed addition
│   ├── podcast-details/     # Paginated episodes list, offline download & queue actions
│   ├── downloads/           # Offline cache dashboard, Range resume & LRU eviction
│   └── player-modal/        # Full-screen modal player container
├── widgets/
│   ├── mini-player/         # Persistent bottom playback bar with progress indicator
│   ├── full-player/         # Scrubbing, speed selector, sleep timer & queue sheet
│   ├── queue-sheet/         # Drag-and-drop reorderable playback queue
│   └── station-list/        # Virtualized list of radio stations
├── features/
│   ├── filter-stations/     # Debounced search, country & genre tag filters (Zustand)
│   ├── subscribe-rss/       # Resilient XML parser, ETag/Last-Modified caching, batch DB writer
│   ├── download-episode/    # Resumable HTTP Range downloader (.part files) & 2GB LRU cache manager
│   ├── playback-controls/   # Transport controls & variable playback speed (0.5x - 2.0x)
│   ├── sleep-timer/         # Scheduled playback pause timer
│   └── stream-recovery/     # JS coordinator & status banner for native StreamGuard events
├── entities/
│   ├── station/             # Radio Browser API client, station domain model & card UI
│   ├── podcast/             # Podcast domain model & WatermelonDB queries
│   ├── episode/             # Episode domain model & 15s throttled playback position persistence
│   └── player/              # Global player store & TrackPlayer controller
└── shared/
    ├── api/                 # Timeout-safe HTTP utilities
    ├── config/              # Environment constants & navigation route types
    ├── db/                  # WatermelonDB schema, migrations, models & JSI SQLite adapter
    ├── lib/
    │   ├── native/          # TypeScript bridge contract for StreamGuardModule
    │   ├── throttle.ts      # Leading/trailing throttle utility with flush support
    │   └── formatTime.ts    # Time formatting helper
    └── ui/                  # Theme palette & base layout containers
```

### Core Subsystems

1. **Database Layer (`@shared/db`)**: Powered by WatermelonDB (`jsi: true`) over SQLite. Stores `podcasts`, `episodes`, and `stations_favorites`. Podcast feeds with 500+ episodes are ingested in chunked `database.batch(...)` transactions to keep the UI thread responsive.
2. **Background Audio & Audio Focus (`@app/services/playbackService.ts`)**: Runs as a Headless JS service registered with `react-native-track-player`. Handles lock-screen controls (`RemotePlay`, `RemotePause`, `RemoteNext`, `RemotePrevious`, `RemoteJumpForward`, `RemoteJumpBackward`, `RemoteSeek`), audio focus interruptions (`RemoteDuck`), and `AUDIO_BECOMING_NOISY` (headphone disconnect).
3. **Throttled Playback Position Persistence (`@entities/episode/persistence.ts`)**: Persists episode progress to SQLite every 15 seconds during active playback and flushes immediately on pause, stop, track switch, or when `AppState` transitions to `background`/`inactive`. Automatically restores the last in-progress episode on cold start.
4. **Resumable Offline Downloader & LRU Cache (`@features/download-episode`)**: Downloads audio files into `<DocumentDir>/episodes_cache` (excluded from iCloud Backup on iOS via `excludeFromBackupKey`). Supports pause and resume from exact byte offsets using `.part` files and `Range: bytes=X-` headers (handling HTTP `206 Partial Content`). Enforces a 2 GB storage ceiling via Least Recently Used (LRU) eviction and cascades file deletion on podcast unsubscribe.
5. **Native `StreamGuard` Module (`StreamGuardModule.kt` / `StreamGuardModule.swift`)**:
   - **Android**: Uses `ConnectivityManager.NetworkCallback` and background `Dispatchers.IO` coroutines to monitor active live streams and network handoffs (`Wi-Fi <-> Cellular`).
   - **iOS**: Uses `NWPathMonitor` on a background `DispatchQueue` and `RCTEventEmitter` to probe stream availability.
   - **Exponential Backoff**: Executes `1s -> 2s -> 4s -> 8s -> 16s -> 30s (max)` retry cycles and emits `StreamGuardRecoveryStatus` events to JS to seamlessly restart live stream playback once connectivity returns.

---

## 2. Local Build & Run Instructions

### Prerequisites

- **Node.js**: `>= 18`
- **Android**: JDK 17, Android SDK (Platform 35, Build Tools 35.0.0, NDK 26.1.10909125), Android Emulator or physical device with USB debugging.
- **iOS (macOS only)**: Xcode 15+, CocoaPods (`bundle exec pod install`).

### Step-by-Step Setup

1. **Install JavaScript dependencies**:
   ```bash
   npm install
   ```

2. **Verify TypeScript compilation**:
   ```bash
   npx tsc --noEmit
   ```

3. **Run on Android**:
   ```bash
   npm run android
   ```

4. **Install Pods & Run on iOS**:
   ```bash
   cd ios && bundle exec pod install && cd ..
   npm run ios
   ```

---

## 3. OEM Battery Optimization & Background Execution Limitations

While standard Android (AOSP) respects Foreground Services with `foregroundServiceType="mediaPlayback"` and partial `WAKE_LOCK`s, several third-party Android OEMs ship proprietary user-space task killers that aggressively terminate background audio services and network sockets after the screen is locked.

To mitigate standard Doze mode restrictions, `StreamGuardModule` exposes `isIgnoringBatteryOptimizations()` and `requestIgnoreBatteryOptimizations()` (`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`), which prompts the user to whitelist the app in Android's `PowerManager`. However, on aggressive OEM ROMs, users may need to configure additional vendor-specific settings:

### Xiaomi (MIUI / HyperOS)
- **Mechanism**: Xiaomi's `PowerKeeper` daemon overrides standard Android Foreground Service priorities and kills background processes after 5–15 minutes of screen-off time, or severs background sockets when switching between Wi-Fi and Mobile Data.
- **Required User Configuration**:
  1. Open **Settings -> Apps -> Manage apps -> RadioPodcastPlayer**.
  2. Enable **Autostart** (Background autostart).
  3. Under **Battery saver**, select **No restrictions** (instead of "MIUI Battery Saver").
  4. In the Recents (multitasking) tray, long-press the app card and tap the **Lock** icon to prevent memory sweeping.

### Huawei (EMUI / HarmonyOS)
- **Mechanism**: Huawei replaces standard AOSP background management with the `HwPFW` (Huawei Power Firewall) and `SmartOptimizer` service, which terminates all non-whitelisted services—including active media playback services—immediately upon screen lock or high memory pressure.
- **Required User Configuration**:
  1. Open **Settings -> Battery -> App launch**.
  2. Locate **RadioPodcastPlayer** and toggle off **Manage automatically**.
  3. In the manual dialog, explicitly enable all three toggles: **Auto-launch**, **Secondary launch**, and **Run in background**.

### Samsung (OneUI)
- **Mechanism**: Samsung's `Device Care` (`Freecess` / `MARs` daemon) places apps into "Sleeping" or "Deep sleeping" buckets and applies "Adaptive Battery" network throttling even when an audio session is paused briefly during an interruption.
- **Required User Configuration**:
  1. Open **Settings -> Apps -> RadioPodcastPlayer -> Battery**.
  2. Select **Unrestricted** (default is "Optimized").
  3. Ensure the app is not listed under **Settings -> Battery and device care -> Battery -> Background usage limits -> Sleeping apps / Deep sleeping apps**, and add it to **Never sleeping apps**.
