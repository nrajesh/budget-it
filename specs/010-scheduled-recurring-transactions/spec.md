# Feature Specification: Scheduled Transactions

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/components/scheduled-transactions/` and `TransactionsContext`

## User Scenarios & Testing

### User Story 1 - Recurring Bills (Priority: P1)

Users can set up recurring transactions (e.g., Rent, Netflix) to be automatically added or flagged for approval.

**Acceptance Scenarios**:
1. **Given** a transaction "Rent", **When** user sets recurrence to "Monthly", **Then** the system projects future rent payments.
2. **Given** a scheduled transaction, **When** the due date arrives, **Then** the system prompts to "Post" it to the real ledger.

### User Story 2 - Calendar Projection (Priority: P2)

Users can see future balances based on scheduled transactions.

**Acceptance Scenarios**:
1. **Given** a calendar view, **When** user looks at next month, **Then** they see projected entries for all scheduled items.

## Requirements

### Functional Requirements
- **FR-001**: System MUST support frequencies: Daily, Weekly, Monthly, Yearly.
- **FR-002**: System MUST support "Next Due Date" calculation logic.
- **FR-003**: System MUST allow converting a Scheduled Transaction into a Real Transaction (`processScheduledTransactions`).

### Key Entities (Budget It Core)
- **ScheduledTransaction**:
    - `id`: UUID
    - `recurrence_frequency`: string
    - `next_date`: ISO Date
    - `auto_pay`: boolean (optional)

## Success Criteria
- **SC-001**: "Post Transaction" action correctly copies all details to a real transaction.
