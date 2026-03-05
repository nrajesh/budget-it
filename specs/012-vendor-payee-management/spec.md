# Feature Specification: Vendor Management (Payees)

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/components/dialogs/AddEditPayeeDialog.tsx`

## User Scenarios & Testing

### User Story 1 - Manage Vendors (Priority: P2)

Users can manage the list of payees/vendors to keep their transaction data clean.

**Acceptance Scenarios**:
1. **Given** a new transaction, **When** user types a new name "New Cafe", **Then** a new Vendor is created automatically.
2. **Given** an existing vendor "Wallmart", **When** user renames it to "Walmart", **Then** all historical transactions should ideally update (or just the vendor record).

## Requirements

### Functional Requirements
- **FR-001**: System MUST create new vendors on the fly during transaction creation.
- **FR-002**: System MUST allow manual creation/editing of vendors.
- **FR-003**: System MUST distinguish between 'Vendors' (external) and 'Accounts' (internal), although both are Payees.

### Key Entities (Budget It Core)
- **Vendor (Payee)**:
    - `id`: UUID
    - `name`: string
    - `is_account`: boolean (false for vendors)
    - `created_at`: ISO Date

## Success Criteria
- **SC-001**: Vendor list is de-duplicated (case insensitive matching).
