# Implementation Tasks: Auto-Import

## Phase 1: Setup
- [x] T001 Define continuity types in `src/types/sync.ts`

## Phase 2: Foundational
- [x] T002 Implement web filesystem helpers in `src/utils/fs-web.ts`
- [x] T003 Implement electron filesystem helpers in `src/utils/fs-electron.ts`
- [x] T004 Create general FS adapter in `src/utils/fs-adapter.ts`
- [x] T005 Update AppSettings type to include `syncDirectoryHandle` and `lastSyncTimestamp` in relevant settings type file
- [x] T005b Modify `backupUtils.ts` and import/export logic to wrap exported data in `SyncPayloadEnvelope`

## Phase 3: Configure Default Sync Location (US1)
**Goal:** User can select a default folder for data storage.
**Test:** Select a folder in settings and verify it persists after restart.
- [x] T006 [P] [US1] Create `useSyncConfig` hook in `src/hooks/useSyncConfig.ts` to manage folder selection and permission persistence
- [x] T007 [US1] Update `src/pages/SettingsPage.tsx` to include the folder picker UI

## Phase 4: Auto-Import on App Load (US2)
**Goal:** App loads latest data from the sync folder on boot.
**Test:** Place a valid `ledger.json` in the sync folder and verify app loads it.
- [x] T008 [US2] Create `useContinuitySync` core hook in `src/hooks/useContinuitySync.ts` to handle boot sync
- [x] T009 [US2] Integrate `useContinuitySync` into `src/App.tsx` to trigger on app mount

## Phase 5: Integrated Auto-Export (US3)
**Goal:** Changes are exported to sync folder automatically.
**Test:** Create a new transaction, verify `ledger.json` in sync folder updates immediately.
- [x] T010 [US3] Integrate `triggerExport` into `TransactionsProvider` to fire on transaction adds, updates, deletes, and budget changesxt to fire on data change

## Phase 6: Polish & Cross-Cutting Concerns
- [ ] T011 Integrate default location option in manual Import/Export UI screens
- [ ] T012 Manual end-to-end verification across Web and Electron builds

## Dependencies & Strategy
- MVP Scope: Complete Phase 1-4 for basic reading capability, follow with Phase 5 representing the complete loop.
- Phase 2 tasks must be completed before any User Story tasks.
- Web vs Electron logic should be cleanly abstracted by `fs-adapter.ts`.
