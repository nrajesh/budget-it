# Feature Specification: Transaction Management

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/contexts/TransactionsContext.tsx`

## User Scenarios & Testing

### User Story 1 - Add/Edit Transactions (Priority: P1)

Users can add income or expense transactions with details like Amount, Date, Payee, Category, and Account.

**Acceptance Scenarios**:

1. **Given** a user on the dashboard, **When** they click "Add Transaction", **Then** a dialog appears.
2. **Given** valid details, **When** user saves, **Then** the transaction is added to the list and account balance updates.
3. **Given** an existing transaction, **When** user edits the amount, **Then** the old record is updated.

### User Story 2 - Transfers (Priority: P2)

Users can transfer money between accounts. This creates a pair of transactions (Out + In) that are linked.

**Acceptance Scenarios**:
1. **Given** "Checking" and "Savings", **When** user creates a transfer of $100 from Checking to Savings, **Then** two transactions are created:
    - Checking: -$100 (Transfer to Savings)
    - Savings: +$100 (Transfer from Checking)
2. **Given** a transfer pair, **When** user updates the amount on one, **Then** the other is automatically updated.

### User Story 3 - Deletion & Undo (Priority: P3)

Users can delete transactions. Deletion supports "Undo" for a short period.

**Acceptance Scenarios**:
1. **Given** a transaction, **When** user deletes it, **Then** it disappears immediately but a "Undo" toast appears.
2. **Given** the undo toast, **When** user clicks Undo, **Then** the transaction reappears.
3. **Given** no undo action, **When** timeout expires (7s), **Then** the transaction is permanently deleted.

## Requirements

### Functional Requirements
- **FR-001**: System MUST support CRUD for transactions.
- **FR-002**: System MUST link transfers using a unique `transfer_id`.
- **FR-003**: System MUST support recurring transactions (Daily, Weekly, Monthly, Yearly).
- **FR-004**: System MUST allow soft-delete with Undo capability.
- **FR-005**: System MUST support split categories (if implemented, TBD).

### Key Entities (Budget It Core)
- **Transaction**:
    - `id`: UUID
    - `user_id`: string (Ledger ID)
    - `account`: string (Account Name)
    - `vendor`: string (Payee Name)
    - `amount`: number
    - `date`: ISO Date
    - `category`: string
    - `sub_category`: string (optional)
    - `payee_id`: string (optional foreign key)
    - `transfer_id`: UUID (optional, for transfers)
    - `recurrence_id`: UUID (optional)

## Success Criteria
- **SC-001**: Transfer pairs always stay in sync.
- **SC-002**: UI updates optimistically on add/edit/delete.
