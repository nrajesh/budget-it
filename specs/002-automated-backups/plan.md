# Implementation Plan: Automated Backups

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**Components**:
- `ScheduledBackups.tsx`: Configuration UI.
- `BackupManager.tsx`: Headless component (logic engine).

**APIs**:
- Web: `window.showDirectoryPicker`, `FileSystemDirectoryHandle`.
- Electron: IPC `saveBackup`.

## Project Structure

### Source Code Impact

```text
src/
├── components/
│   └── backup/
│       ├── ScheduledBackups.tsx    # UI
│       └── BackupManager.tsx       # Background Logic
├── utils/
│   └── electron.ts                 # Electron Bridge
```

## Implementation Strategy

### Background Loop
- `BackupManager` mounts at app root.
- Runs `setInterval` loop.
- Checks `db.backup_configs` for due items (`nextBackup <= now`).
- Executes backup -> Updates `nextBackup`.

### Security (Web)
- Browser requires re-granting permissions after reload.
- UI must show "Permission Needed" state if handle is stale.
