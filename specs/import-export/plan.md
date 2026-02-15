# Implementation Plan: Data Management

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**Components**:
- `DataManagementPage.tsx`: Main UI.
- `BackupManager.tsx` (Partially used here for logic, but mainly for automation).
- `backupUtils.ts`: logic for `generateBackupData`, `processImport`.

## Project Structure

### Source Code Impact

```text
src/
├── pages/
│   └── DataManagementPage.tsx    # UI for Manual Backup, Reset, Demo Data
├── utils/
│   ├── backupUtils.ts            # Backup generation/parsing logic
│   └── crypto.ts                 # Encryption logic
```

## Implementation Strategy

### Reset Logic
- `dataProvider.clearAllData()`: Truncates all tables.
- **Critical**: Must refresh Contexts (`useLedger`, `useTransactions`) after wipe to clear in-memory state.

### Demo Data
- `generateDiverseDemoData`: Creates a set of randomized transactions, vendors, and categories to showcase app features.
