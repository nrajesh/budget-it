# Feature Specification: Dashboard

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/components/dashboard/`

## User Scenarios & Testing

### User Story 1 - Financial Pulse (Priority: P1)

Users see a high-level overview of their finances immediately upon login.

**Acceptance Scenarios**:
1. **Given** a user with transactions, **When** they view the dashboard, **Then** they see "Net Worth", "Assets", and "Debts" cards.
2. **Given** a budget, **When** they view the dashboard, **Then** a "Budget Status" card shows their remaining budget for the period.
3. **Given** variable income/expenses, **When** they view the "Runway" card, **Then** it estimates how long their funds will last.

### User Story 2 - Recent Activity (Priority: P2)

Users can see their most recent transactions and quickly add new ones.

**Acceptance Scenarios**:
1. **Given** the dashboard, **When** user looks at "Recent Transactions", **Then** the last 5-10 transactions are listed sequentially.

## Requirements

### Functional Requirements
- **FR-001**: Dashboard MUST display total Assets, Debts, and Net Worth.
- **FR-002**: Dashboard MUST display a "Runway" calculation (months of survival).
- **FR-003**: Dashboard MUST show a "Budget Status" summary (total spent vs total budget).
- **FR-004**: Dashboard MUST include a "Recent Activity" feed.
- **FR-005**: Dashboard MUST include a "Financial Pulse" score (0-100) based on health metrics.

### Key Entities (Budget It Core)
- **Dashboard Widget**:
    - `type`: 'metric' | 'chart' | 'feed'
    - `data_source`: 'transactions' | 'budgets' | 'accounts'

## Success Criteria
- **SC-001**: Dashboard loads in < 1s (cached data).
- **SC-002**: Financial Pulse score updates correctly when debts change.
