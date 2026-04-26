# Implementation Plan: Implement Capacitor Native Mobile Wrapper

**Branch**: `011-implement-capacitor-native` | **Date**: 2026-03-01 | **Spec**: `/specs/011-implement-capacitor-native/spec.md`
**Input**: Feature specification from `/specs/011-implement-capacitor-native/spec.md`

## Summary

This plan outlines the steps to wrap the existing Vaulted Money Web Application in a native mobile shell (iOS/Android) using Capacitor. Based on research regarding mobile OS sandboxing limitations, we will bypass the need for a web-like "Directory Picker" by defaulting the sync location to the platform-native `Documents` directory using `@capacitor/filesystem`. This ensures 100% reliable read/write access and leverages built-in OS sync (like iCloud Drive).

### Architecture Diagram

```mermaid
flowchart TD
    A[Vaulted Money App \n React / Hooks] --> B(fs-adapter.ts \n Unified API Layer)
    
    B -->|isElectron() === true| C(fs-electron.ts)
    B -->|Capacitor.isNativePlatform() === true| D(fs-capacitor.ts)
    B -->|Fallback| E(fs-web.ts)
    
    C --> F[(Node \n fs module)]
    D --> G[(Capacitor \n Filesystem API)]
    E --> H[(Web \n File System Access API)]
```

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18, Vite 5, Capacitor 6, Tailwind CSS, TanStack Query, Dexie.js (IndexedDB)
**Testing**: Vitest, React Testing Library
**Target Platform**: Web, Desktop (Electron), Native Mobile (iOS/Android via Capacitor)
**Project Type**: Hybrid Web/Electron/Mobile App
**Performance Goals**: <100ms UI response
**Constraints**: Fully offline capable, No external API dependencies. Native modules must fall back gracefully.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Privacy First / Local First**: Passes. Capacitor writes directly to the local device storage. No cloud servers are involved from the App's perspective.
- **Platform Agnostic**: Passes. The `fs-adapter.ts` unified layer will appropriately route `Web`, `Electron`, and now `Capacitor` file system API calls.

## Project Structure

### Documentation (this feature)

```text
specs/011-implement-capacitor-native/
├── plan.md              # This file
├── spec.md              # Requirements
├── research.md          # Implementation research
└── tasks.md             # Actionable tasks
```

### Source Code Impact

```text
vaulted-money/
├── capacitor.config.ts        # [NEW] Capacitor configuration
├── android/                   # [NEW] Generated Android Studio project
├── ios/                       # [NEW] Generated Xcode project
├── src/
│   ├── utils/
│   │   ├── fs-adapter.ts      # [MODIFY] Add routing for Capacitor
│   │   └── fs-capacitor.ts    # [NEW] Capacitor Filesystem implementation
│   ├── hooks/
│   │   ├── useSyncConfig.ts   # [MODIFY] Adjust wording for Capacitor (no picker needed)
│   │   └── useContinuitySync.ts # [MODIFY] Handle Capacitor-specific boot logic
└── package.json               # [MODIFY] Add @capacitor/* dependencies
```

**Structure Decision**: Adhering to standard `Vaulted Money` modular architecture by extending the `fs-adapter.ts` pattern.

## Implementation Details

1. **Install Dependencies**:
   - `npm install @capacitor/core @capacitor/ios @capacitor/android @capacitor/filesystem`
   - `npm install -D @capacitor/cli`
2. **Initialize Capacitor**:
   - Run `npx cap init` and set the webDir to `dist`.
3. **FS Adapter (`fs-capacitor.ts`)**:
   - Implement `getCapacitorDirectoryHandle()` (returns a static string/reference to `Directory.Documents`).
   - Implement `readCapacitorFile` and `writeCapacitorFile` using `Filesystem.readFile` and `Filesystem.writeFile`.
4. **Adapter Routing (`fs-adapter.ts`)**:
   - Use `Capacitor.isNativePlatform()` to route underlying calls to the new adapter when running in iOS/Android, skipping the Web handles entirely.
5. **UI Adjustments**:
   - In `SettingsPage.tsx` and `useSyncConfig.ts`, if `Capacitor.isNativePlatform()` is true, the "Select Folder" button should just automatically acknowledge the `Documents` directory instead of trying to open an unsupported Web window.

## Verification Plan

Because Capacitor requires native emulators to test *native* features, verification will be done manually by running the iOS Simulator via Xcode, or via automated Web testing to ensure regressions were not introduced to the Web build.

### Automated Tests (Web Regression)
- `npm run lint` - Ensure no TS/ESLint errors introduced by Capacitor plugins.
- `npx tsc --noEmit` - Ensure type safety across the new adapter.
- `npm run build` - Ensure Vite builds the project successfully.

### Manual Verification (iOS Simulator)
1. Run `npx cap sync ios`.
2. Open `ios/App/App.xcworkspace` in Xcode.
3. Select an iOS Simulator (e.g., iPhone 15 Pro) and click Run.
4. Navigate to Vaulted Money Settings -> Cross-Device Continuity.
5. Enable Auto-Sync. The system should default to the App's Documents folder.
6. Create a budget or transaction.
7. Open the iOS "Files" app inside the simulator, navigate to "On My iPhone -> Vaulted Money -> Documents" and verify that `ledger.json` was created successfully.
