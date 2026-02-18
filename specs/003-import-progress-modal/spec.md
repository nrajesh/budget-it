# Feature Specification: Import Progress Modal

**Feature Branch**: `003-import-progress-modal`  
**Created**: 2026-02-18  
**Status**: Draft  
**Input**: User description: "When generating demo data in ledger select screen or when importing a CSV/JSON in that screen there is no progress bar and this leads to user thinking app is not responding. Ensure to add a modal popup indicating data load progress. Consider reusing the demo data generation progress bar in data screen like the one attached."

## User Scenarios & Testing

### User Story 1 - Demo Data Generation Progress on Ledger Select Screen (Priority: P1)

A new user on the Ledger Select screen clicks "Generate Data". Currently, the `generateDiverseDemoData` function fires and updates `operationProgress` in `TransactionsContext`, but because `LedgerEntryPage` renders **outside** the `Layout` component (which hosts `GlobalProgressDialog`), the progress modal never appears. The user sees no feedback and may think the app has frozen.

**Why this priority**: This is the most common first-time user action and the most confusing without feedback — the generation takes several seconds.

**Independent Test**: Navigate to `/ledgers`, click "Generate Data" → confirm. A progress modal (matching the existing Data screen modal) should appear with title, stage description, progress bar, and percentage.

**Acceptance Scenarios**:

1. **Given** the user is on the Ledger Select page, **When** they confirm demo data generation, **Then** a progress modal appears showing "Generating Demo Data" with a progress bar that updates from 0% to 100%.
2. **Given** the progress modal is visible, **When** the progress reaches 100%, **Then** the modal auto-closes and the page refreshes with new ledger data.

---

### User Story 2 - CSV Import Progress on Ledger Select Screen (Priority: P2)

A user imports a CSV file on the Ledger Select screen. After selecting the file, configuring the ledger, and confirming column mappings, the `handleMappingConfirmed` function runs through multiple async steps (create ledger, ensure payees, ensure categories, bulk-insert transactions). No progress feedback is shown during this multi-step process.

**Why this priority**: CSV import can take significant time with large files and multiple entity creation steps. Users need to see that processing is happening.

**Independent Test**: On `/ledgers`, click "Import Transactions CSV", select a CSV file, fill ledger details, map columns → confirm. A progress modal should appear showing import stages (creating ledger, importing accounts, importing categories, inserting transactions).

**Acceptance Scenarios**:

1. **Given** the user confirms CSV column mappings, **When** import starts, **Then** a progress modal appears showing staged progress (creating entities, inserting transactions).
2. **Given** the import completes successfully, **When** progress reaches 100%, **Then** the modal closes and a success toast appears.
3. **Given** the import fails, **When** an error occurs, **Then** the modal closes and an error toast appears.

---

### User Story 3 - JSON Backup Import Progress on Ledger Select Screen (Priority: P3)

A user imports a JSON backup file on the Ledger Select screen. This is typically quick for small files but can take time for large backups. No progress indicator is shown during parsing and database import.

**Why this priority**: JSON import is less common but still benefits from feedback, especially for encrypted backups which require decryption time.

**Independent Test**: On `/ledgers`, click "Import Backup", select a JSON file. A progress modal should appear during parsing and import.

**Acceptance Scenarios**:

1. **Given** the user selects a valid JSON file, **When** import processing begins, **Then** a progress modal appears showing "Importing Data".
2. **Given** an encrypted backup is selected, **When** the password is entered and decryption starts, **Then** a progress modal appears showing "Decrypting & Importing".

---

### Edge Cases

- What happens if the user tries to dismiss the progress modal? → Modal should not be dismissible until operation completes (matching existing behavior).
- What happens if an error occurs mid-import? → Modal should close and error toast should appear.
- What happens if the browser tab is minimized during import? → Progress continues in background; modal shows final state when tab is focused.

## Requirements

### Functional Requirements
- **FR-001**: `LedgerEntryPage` MUST display a progress modal during demo data generation, CSV import, and JSON backup import operations.
- **FR-002**: The progress modal MUST reuse the existing `GlobalProgressDialog` component and `operationProgress` from `TransactionsContext`.
- **FR-003**: CSV import MUST report progress at meaningful stages: ledger creation, account setup, category setup, transaction insertion.
- **FR-004**: JSON import MUST report progress at start and completion.
- **FR-005**: The modal MUST not be dismissible during active operations (matching existing behavior).

### Standard Requirements (Budget It)
- **FR-STD-01**: Feature MUST be fully responsive and usable on mobile (375px+) and desktop.
- **FR-STD-02**: Feature MUST support both Light and Dark modes using Tailwind CSS variables.
- **FR-STD-03**: Feature MUST work offline without any network dependency.
- **FR-STD-04**: Feature MUST be compatible with both Web and Electron environments.

### Component Impact
- **Modified Components**: `src/pages/LedgerEntryPage.tsx` (add `GlobalProgressDialog` + progress calls)
- **Reused Components**: `src/components/dialogs/GlobalProgressDialog.tsx` (no changes needed)
- **Context Used**: `src/contexts/TransactionsContext.tsx` (existing `setOperationProgress` — no changes needed)

### Key Entities
- No new entities introduced. This feature is purely a UX enhancement.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users see a progress modal within 200ms of initiating any data operation on the Ledger Select screen.
- **SC-002**: Progress bar accurately reflects operation stage (not just spinning).
- **SC-003**: Zero UI freeze perceived during demo data generation or file import.
- **SC-004**: The progress modal on the Ledger Select screen is visually identical to the existing one on the Data Management page.
