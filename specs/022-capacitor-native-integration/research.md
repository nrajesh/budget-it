# Implementation Research: Capacitor Native Mobile Wrapper

## Unknowns Resolved

### 1. How does the user select an arbitrary sync folder on mobile?
**Decision**: Do not use a native "folder picker". Instead, default the sync directory to the App's shared `Documents` directory defined by the host OS.
**Rationale**: Mobile operating systems (iOS and Android) heavily sandbox applications. While there are community plugins for picking arbitrary folders, iOS heavily restricts background access to outside folders. However, reading and writing to the app's own `Documents` directory (`Directory.Documents` in `@capacitor/filesystem`) is guaranteed to work 100% of the time. Furthermore, on iOS, the app's Documents directory is natively integrated into the iOS "Files" app and automatically syncs to iCloud Drive if the user has iCloud turned on. On Android, the Documents directory is accessible globally.
**Alternatives considered**: Using a community directory picker plugin. Rejected because of instability, complex permission handling across OS upgrades (like Scoped Storage on Android 11+), and poor background-sync compatibility on iOS.

### 2. Which Capacitor packages are required?
**Decision**: Use standard official plugins.
**Rationale**: 
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android` for core infrastructure.
- `@capacitor/filesystem` for file reading/writing.
- `@capacitor/preferences` (optional, for replacing IDB if IDB fails in mobile WebViews, but IDB should work fine in modern Capacitor WebViews).

### 3. How to seamlessly branch logic in fs-adapter.ts?
**Decision**: Use `Capacitor.isNativePlatform()`.
**Rationale**: Capacitor's core library exposes this method, which returns `true` when running inside the native iOS or Android wrapper, and `false` when running in the web browser or Electron. We will branch `fs-adapter.ts` to call `fs-capacitor.ts` when true.
