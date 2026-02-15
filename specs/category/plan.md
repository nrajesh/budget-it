# Implementation Plan: Category Management

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**State**: `LocalDataProvider` methods
**Database**: Dexie.js tables `categories` and `sub_categories`

## Project Structure

### Source Code Impact

```text
src/
├── providers/
│   └── LocalDataProvider.ts   # Contains ensureCategoryExists, mergeCategories
```

## Implementation Strategy

### Data Integrity
- `ensureCategoryExists`: Checks by name + user_id. If not found, creates.
- `mergeCategories`: Complex transaction. Updates transactions, updates budgets, moves sub-categories, deletes source categories.

### Hierarchy
- Sub-categories are strictly children of Categories.
- UI typically shows them as `Category: Sub-Category` or grouped.
