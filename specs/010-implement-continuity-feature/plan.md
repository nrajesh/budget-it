# Implementation Plan: Auto-Import

**Branch**: `010-implement-continuity-feature` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-implement-continuity-feature/spec.md`

## Summary

Implement an auto-import/export continuity feature allowing users to designate a default local folder (which they can sync via iCloud/Drive) to seamlessly persist ledger data across devices. The feature will use the File System Access API for the web and native `fs` bindings for Electron to maintain continuous sync without manual intervention.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18, Vite 5, Electron, Tailwind CSS, TanStack Query, Dexie.js (IndexedDB)
**Testing**: Vitest, React Testing Library
**Target Platform**: Web (Modern Browsers), Desktop (Electron - macOS/Windows/Linux)
**Project Type**: Hybrid Web/Electron App
**Performance Goals**: <100ms UI response, Optimistic updates via TanStack Query
**Constraints**: Fully offline capable, No external API dependencies (except exchange rates)

## Constitution Check

*GATE: Passed. Complies with Privacy First and Local-First (uses user's own synced folders instead of a cloud database).*

## Project Structure

### Documentation (this feature)

```text
specs/010-implement-continuity-feature/
├── plan.md              # This file
├── spec.md              # Requirements
├── research.md          # Implementation research
├── tasks.md             # Actionable tasks
├── data-model.md        # Data models
```

### Source Code Impact

```text
budget-it/
├── electron/
│   ├── main.ts                # Add IPC handlers for folder selection & fs ops
│   └── preload.ts             # Expose fs APIs to renderer
├── src/
│   ├── hooks/
│   │   └── useContinuitySync.ts # Core hook for auto-import/export logic
│   ├── pages/
│   │   └── SettingsPage.tsx   # UI to select default sync directory
│   ├── utils/
│   │   ├── fs-web.ts          # File System Access API wrappers
│   │   └── fs-electron.ts     # Electron IPC wrappers
│   └── App.tsx                # Mount point for auto-import on boot
```

## Proposed Changes

### Phase 1: Storage and API Wrappers
Create abstract file system utilities that work across both Web (File System Access API) and Electron (`fs`). These functions will handle reading and writing the canonical `ledger.json` to the user's selected directory.
Update the existing export/import utilities (e.g., `backupUtils.ts` and `finance-data.ts`) to wrap the exported data in a `SyncPayloadEnvelope` containing the application and database schema version. Implement validation logic to warn users when importing data from an incompatible version.

### Phase 2: React Hooks and State Integration
Implement `useContinuitySync.ts` to hook into the application's boot sequence (to trigger an import) and into the save/mutation sequence (to trigger an export). It will manage permissions (e.g., prompting the user on Web to re-grant access if the handle is dormant).

### Phase 3: Settings UI
Add a new section in the settings to let users designate the sync folder. It will display the current folder status (e.g., "Active", "Permission Needed").

## Verification Plan

### Automated Tests
- Test the `fs-web` and `fs-electron` wrapper interfaces with mocked handles/IPC.
- Test `useContinuitySync` to ensure it requests imports correctly on load.

### Manual Verification
1. Open the app in a web browser.
2. Go to Settings -> Select Sync Folder. Pick a local folder.
3. Make a test transaction. Verify a `budget-it-sync.json` file is created in that folder.
4. Reload the page. Ensure the app picks up the transaction automatically.
