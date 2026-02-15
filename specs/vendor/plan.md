# Implementation Plan: Vendor Management

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**State**: `TransactionsContext` (provides `vendors` array)
**Database**: Dexie.js table `payees` (Note: 'payees' covers both Vendors and Accounts)

## Project Structure

### Source Code Impact

```text
src/
├── components/
│   └── dialogs/
│       └── AddEditPayeeDialog.tsx
└── contexts/
    └── TransactionsContext.tsx    # Fetches vendors via dataProvider.getAllVendors()
```

## Implementation Strategy

### Data Structure
- `Payee` entity handles both Accounts and Vendors.
- `is_account` flag distinguishes them.

### Auto-Creation
- When adding a transaction, if the vendor name doesn't exist in the `payees` table, logic in `dataProvider.addTransaction` (or UI handler) likely creates it.
