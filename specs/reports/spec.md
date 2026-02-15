# Feature Specification: Reports & Analytics

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/components/reports/`

## User Scenarios & Testing

### User Story 1 - Spending Analysis (Priority: P1)

Users can analyze their spending patterns by category, time, or payee.

**Acceptance Scenarios**:
1. **Given** a date range (Last Month), **When** user views "Spending by Category", **Then** a pie/bar chart shows distribution.
2. **Given** a specific payee "Amazon", **When** user filters reports, **Then** they see total spent per month at Amazon.

### User Story 2 - Income vs Expense (Priority: P2)

Users can track their cash flow over time.

**Acceptance Scenarios**:
1. **Given** the "Cash Flow" report, **When** user views the current year, **Then** a bar chart shows Income vs Expenses for each month.

## Requirements

### Functional Requirements
- **FR-001**: System MUST generate "Spending by Category" report.
- **FR-002**: System MUST generate "Income vs Expense" (Cash Flow) report.
- **FR-003**: System MUST support date range filtering (Custom, Last 30 Days, YTD).
- **FR-004**: System MUST support exporting reports to PDF/CSV (if implemented).

### Key Entities (Budget It Core)
- **ReportFilter**:
    - `dateRange`: { start, end }
    - `accounts`: string[]
    - `categories`: string[]

## Success Criteria
- **SC-001**: Reports render within 2s for < 5000 transactions.
