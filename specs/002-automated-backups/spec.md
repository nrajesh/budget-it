# Feature Specification: Automated Backups

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/components/backup/ScheduledBackups.tsx`

## User Scenarios & Testing

### User Story 1 - Schedule Backups (Priority: P1)

Users can configure the application to automatically save backups to a local folder at a set interval.

**Acceptance Scenarios**:
1. **Given** a supported browser (Chrome/Edge), **When** user selects a folder and sets interval "1h", **Then** the app saves a backup JSON every hour while running.
2. **Given** the Desktop App (Electron), **When** user sets a path, **Then** backups occur in the background without permission re-prompts.

### User Story 2 - Encrypted Auto-Backups (Priority: P2)

Users can ensure their automated backups are secure.

**Acceptance Scenarios**:
1. **Given** a schedule, **When** user enables encryption and sets a password, **Then** background backups are saved as `.lock` files.

## Requirements

### Functional Requirements
- **FR-001**: System MUST use File System Access API (Web) or Electron API (Desktop) for file writing.
- **FR-002**: System MUST run backups in the background (via `setInterval` or worker).
- **FR-003**: System MUST persist backup configurations in DB.
- **FR-004**: System MUST handle permission expiry gracefully (Web).

### Key Entities (Budget It Core)
- **BackupConfig**:
    - `id`: UUID
    - `frequency`: number (ms)
    - `directoryHandle`: FileSystemDirectoryHandle (Web)
    - `path`: string (Electron)
    - `encrypted`: boolean
    - `isActive`: boolean

## Success Criteria
- **SC-001**: Backups are written silently without user intervention after initial setup.
