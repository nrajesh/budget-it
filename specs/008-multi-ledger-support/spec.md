# Feature Specification: Ledger (Multi-ledger Support)

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/contexts/LedgerContext.tsx`

## User Scenarios & Testing

### User Story 1 - Create and Switch Ledgers (Priority: P1)

Users can create multiple independent ledgers (e.g., Personal, Business) and switch between them.

**Why this priority**: Core architectural feature allowing data isolation.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they create a ledger named "Business", **Then** it is saved to the database and becomes active.
2. **Given** multiple ledgers, **When** user switches to "Personal", **Then** the application reloads with "Personal" context, clearing previous filters.
3. **Given** an active ledger, **When** user updates its currency, **Then** the global currency setting is updated.

## Requirements

### Functional Requirements
- **FR-001**: System MUST support creating new ledgers with Name, Currency, and Icon.
- **FR-002**: System MUST allow switching between active ledgers.
- **FR-003**: System MUST isolate view state (filters, search) when switching ledgers.
- **FR-004**: System MUST persist the last active ledger ID.
- **FR-005**: System MUST support deleting a ledger and its associated data (cascading delete).

### Key Entities (Budget It Core)
- **Ledger**: Container for all other entities (Account, Transaction, etc.).
    - `id`: UUID
    - `name`: string
    - `currency`: string (ISO code)
    - `icon`: string (emoji/url)
    - `last_accessed`: ISO Date string

## Success Criteria
- **SC-001**: Context switching (reloading app) takes < 2 seconds.
- **SC-002**: No data leakage between ledgers (filters cleared).
