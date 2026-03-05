# Feature Specification: Category Management

**Feature Branch**: `main` (Existing)
**Created**: 2026-02-15
**Status**: Implemented
**Input**: Reverse-engineered from `src/providers/LocalDataProvider.ts`

## User Scenarios & Testing

### User Story 1 - Categorize Transactions (Priority: P1)

Users can assign categories to transactions to track spending.

**Acceptance Scenarios**:
1. **Given** a transaction, **When** user types a new category "Hobbies", **Then** the category is created.
2. **Given** a category, **When** user adds a sub-category "Painting", **Then** it is linked to "Hobbies".

### User Story 2 - Merge Categories (Priority: P3)

Users can merge two categories into one (e.g., "Food" and "Dining" -> "Food & Dining").

**Acceptance Scenarios**:
1. **Given** two categories, **When** user merges them, **Then** all transactions are updated to the target category, and the old category is deleted.

## Requirements

### Functional Requirements
- **FR-001**: System MUST support hierarchical categories (Category -> Sub-category).
- **FR-002**: System MUST allow renaming categories.
- **FR-003**: System MUST support merging categories.

### Key Entities (Budget It Core)
- **Category**:
    - `id`: UUID
    - `name`: string
    - `user_id`: string (Ledger ID)
- **SubCategory**:
    - `id`: UUID
    - `category_id`: UUID
    - `name`: string

## Success Criteria
- **SC-001**: No orphan sub-categories allowed (cascade delete).
