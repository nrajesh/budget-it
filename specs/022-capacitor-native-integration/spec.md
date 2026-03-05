# Feature Specification: Implement Capacitor Native Mobile Wrapper

**Feature Branch**: `011-implement-capacitor-native`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "I would go with capacitor approach, but as a new speckit feature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seamless Mobile Onboarding & Sync Setup (Priority: P1)

As a mobile user newly installing the app on iOS or Android, I want to easily choose a local folder on my device for synchronization so that my financial data stays updated across my devices without relying on third-party cloud servers.

**Why this priority**: Core value proposition. For the cross-device continuity feature to actually work on mobile (which blocks the Web File System API), a native wrapper and a functional native folder picker are strictly required.

**Independent Test**: Can be fully tested by launching the app in an iOS Simulator or Android Emulator, navigating to Settings, enabling "Cross-Device Continuity", and successfully picking a directory from the native file system dialog without encountering "Not Supported" errors.

**Acceptance Scenarios**:

1. **Given** the user has launched the Capacitor-wrapped mobile app, **When** they tap "Select Folder" in the sync settings, **Then** the native iOS/Android file picker should appear instead of the web browser picker.
2. **Given** the user has selected a folder via the native picker, **When** they return to the app, **Then** the app should save the folder path and immediately attempt a sync operation without throwing permission errors.

---

### User Story 2 - Automated Background Syncing on Mobile (Priority: P2)

As a mobile user, I want the app to automatically sync my transactions when I open the app and when I make changes, so that I don't have to manually trigger syncs every time I add an expense on the go.

**Why this priority**: Essential for a smooth user experience. On mobile, users frequently open and close apps; the sync must happen reliably during these lifecycle events.

**Independent Test**: Can be tested by altering the `ledger.json` file externally (e.g., via iCloud Drive syncing from a Mac), opening the mobile app, and verifying the new data is automatically loaded.

**Acceptance Scenarios**:

1. **Given** the app is fully closed on the mobile device, **When** the user launches it, **Then** it should automatically read the latest `ledger.json` from the configured native path and update the UI.
2. **Given** the user creates a new transaction on mobile, **When** they hit save, **Then** the app should seamlessly write the updated `ledger.json` to the native file system in the background.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST integrate Capacitor dependencies and configuration (`capacitor.config.ts`, Android/iOS project folders) into the existing Vite/React workflow without breaking the standard web build.
- **FR-002**: System MUST introduce a new `fs-capacitor.ts` adapter utilizing `@capacitor/filesystem` (or another appropriate Capacitor community plugin like `directory-picker` if standard file system access is insufficient for external shared folders).
- **FR-003**: System MUST update the unified `fs-adapter.ts` to detect the Capacitor runtime (`Capacitor.isNativePlatform()`) and route file system calls (select folder, read, write) to the `fs-capacitor.ts` implementation instead of the Web or Electron implementations.
- **FR-004**: System MUST handle native mobile permissions (e.g., requesting external storage read/write access on Android) gracefully when setting up the sync folder.

### Standard Requirements (Budget It)
- **FR-STD-01**: Feature MUST be fully responsive and usable on mobile (375px+) and desktop.
- **FR-STD-02**: Feature MUST support both Light and Dark modes using Tailwind CSS variables.
- **FR-STD-03**: Feature MUST work offline without any network dependency (unless explicitly stating otherwise).
- **FR-STD-04**: Feature MUST be compatible with both Web and Electron environments.
- **FR-STD-05**: All user inputs MUST be validated using Zod schemas.

### Component Impact
- **New Components**: `src/utils/fs-capacitor.ts`
- **Modified Components**: 
  - `src/utils/fs-adapter.ts`
  - `package.json` (Adding Capacitor dependencies/scripts)
  - `vite.config.ts` (If specific mobile proxy/build settings are required)
- **Context Updates**: None structurally, though hooks calling external file systems will naturally route through the updated adapter.

### Key Entities (Budget It Core)

- **Ledger**: The central storage which hosts user's finance. Consider it equivalent of a private book which can be passed on to another user. This is primordial to all other entities.
- **Transaction**: The central unit of data. Linked to Account, Category, and (optionally) Vendor/Payee.
- **Account**: Source of funds (Checking, Credit Card, Savings). Tracks current balance and currency.
- **Vendor**: The merchant or payee (e.g., "Starbucks", "Landlord").
- **Category**: Hierarchical classification (e.g., `Food > Groceries`).
- **Budget**: Spending limit or a goal for a specific category or group of categories over a period.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The application builds successfully for the iOS target (`npx cap sync ios`) without compilation errors.
- **SC-002**: A user running the app in the iOS Simulator can successfully select a synchronization directory.
- **SC-003**: A user running the app in the iOS Simulator can create/edit a transaction and verify that a `.json` file is correctly written to the selected native directory.
- **SC-004**: Web and Electron builds continue to function with 0 regressions in their respective file system access methods.
