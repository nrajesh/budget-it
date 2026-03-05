# Feature Specification: Data Management

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/pages/DataManagementPage.tsx`

## User Scenarios & Testing

### User Story 1 - Backup & Restore (Priority: P1)

Users can manually back up their data to a JSON file and restore it, with optional encryption.

**Acceptance Scenarios**:
1. **Given** a user with data, **When** they click "Export JSON", **Then** a full backup file is downloaded.
2. **Given** a sensitive environment, **When** user selects "Export Encrypted" and sets a password, **Then** an encrypted `.lock` file is downloaded.
3. **Given** a valid backup file, **When** user imports it, **Then** the application state is restored.

### User Story 2 - Reset Data (Priority: P3)

Users can wipe all data to start fresh.

**Acceptance Scenarios**:
1. **Given** the Data page, **When** user clicks "Reset All Data" and confirms, **Then** all transactions, accounts, and vendors are permanently deleted.

### User Story 3 - Demo Data (Priority: P3)

Users can generate demo data for testing.

**Acceptance Scenarios**:
1. **Given** a clean slate (or after reset), **When** user clicks "Generate Demo Data", **Then** the app is populated with sample recurring transactions and categories.

## Requirements

### Functional Requirements
- **FR-001**: System MUST support JSON export/import.
- **FR-002**: System MUST support AES encryption for backups (using `crypto` utils).
- **FR-003**: System MUST provide a "Hard Reset" function that clears Dexie DB.
- **FR-004**: System MUST provide a Demo Data generator.

### Key Entities (Budget It Core)
- **BackupData**:
    - `version`: string
    - `timestamp`: ISO Date
    - `data`: object (tables)

## Success Criteria
- **SC-001**: Encrypted backups cannot be opened without the correct password.
