# Feature Specification: Budgeting

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/providers/LocalDataProvider.ts`

## User Scenarios & Testing

### User Story 1 - Set Budgets (Priority: P1)

Users can set spending limits for specific categories.

**Acceptance Scenarios**:
1. **Given** a category "Groceries", **When** user sets a budget of $500, **Then** the system tracks spending against this limit.
2. **Given** a budget, **When** spending exceeds 80%, **Then** (optional) UI shows warning color.

### User Story 2 - Budget Scoping (Priority: P2)

Budgets can be scoped to specific accounts (e.g., "Business Budget" only counts "Business Checking" transactions).

## Requirements

### Functional Requirements
- **FR-001**: System MUST create budgets for Category (and optional Sub-category).
- **FR-002**: System MUST calculate `spent_amount` dynamically based on transactions within the date range.
- **FR-003**: System MUST support `account_scope` (Global vs specific accounts).

### Key Entities (Budget It Core)
- **Budget**:
    - `id`: UUID
    - `name`: string
    - `amount`: number
    - `category_name`: string
    - `sub_category_name`: string (optional)
    - `start_date`: ISO Date
    - `end_date`: ISO Date (optional)
    - `period`: 'monthly', 'yearly', 'one-time'
    - `account_scope`: 'GLOBAL' | 'GROUP' | 'create_new'

## Success Criteria
- **SC-001**: Budget progress bars accurately reflect spending.
