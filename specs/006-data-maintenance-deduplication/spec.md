# Feature Specification: Data Maintenance

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/components/management/`

## User Scenarios & Testing

### User Story 1 - Deduplicate Payees (Priority: P2)

Users can merge duplicate payees/accounts that may have been created accidentally (e.g., "Amazon" vs "Amazon.com").

**Acceptance Scenarios**:
1. **Given** two payees "Amazon" and "Amzn", **When** user selects "Amazon" as master and merges "Amzn" into it, **Then** all transactions for "Amzn" are reassigned to "Amazon" and "Amzn" is deleted.

### User Story 2 - Cleanup Unused Entities (Priority: P3)

Users can keep their lists clean by removing unused categories or vendors.

**Acceptance Scenarios**:
1. **Given** a list of vendors with 0 transactions, **When** user clicks "Cleanup", **Then** they can bulk delete them.

## Requirements

### Functional Requirements
- **FR-001**: System MUST support merging Payees (Vendors/Accounts).
- **FR-002**: System MUST support merging Categories.
- **FR-003**: System MUST identify and allow deletion of unused entities (0 transactions).
- **FR-004**: System MUST recalculate ledger stats after maintenance operations.

### Key Entities (Budget It Core)
- **MaintenanceAction**:
    - `type`: 'merge' | 'delete'
    - `entityType`: 'vendor' | 'category'
    - `targetId`: UUID (for merge)
    - `sourceIds`: UUID[]

## Success Criteria
- **SC-001**: Merge operation maintains data integrity (no orphaned transactions).
