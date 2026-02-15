# Feature Specification: Account Management

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/contexts/TransactionsContext.tsx` and data provider.

## User Scenarios & Testing

### User Story 1 - Manage Accounts (Priority: P1)

Users can create, edit, and delete accounts (e.g., "Chase Checking", "Amex Gold").

**Acceptance Scenarios**:

1. **Given** a new user, **When** they add an account "Cash", **Then** it appears in the account list with 0 balance.
2. **Given** an existing account, **When** user edits the name, **Then** the change is reflected immediately.
3. **Given** an account with transactions, **When** user deletes it, **Then** all associated transactions are also deleted (or orphaned, TBD based on implementation).

### User Story 2 - Account Types (Priority: P2)

Accounts have types (Checking, Savings, Credit Card, Investment) that may affect how they are displayed or calculated.

## Requirements

### Functional Requirements
- **FR-001**: System MUST create accounts with Name, Type, Initial Balance (optional), and Currency.
- **FR-002**: System MUST list all accounts for the **active ledger**.
- **FR-003**: System MUST calculate current balance based on initial balance + sum of transactions.
- **FR-004**: System MUST support account groups (e.g. "Liquid Assets", "Credit Cards").

### Key Entities (Budget It Core)
- **Account**:
    - `id`: UUID
    - `ledger_id`: UUID (Foreign Key)
    - `name`: string
    - `type`: enum (checking, savings, credit, etc.)
    - `currency`: string
    - `initial_balance`: number (default 0)
    - `group`: string (optional grouping)

## Success Criteria
- **SC-001**: Account balance updates instantly when a transaction is added.
