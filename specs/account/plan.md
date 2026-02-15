# Implementation Plan: Account Management

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**State**: `TransactionsContext` (oddly enough, accounts seem to be managed here or alongside transactions)
**Database**: Dexie.js table `accounts`

## Project Structure

### Source Code Impact

```text
src/
├── contexts/
│   └── TransactionsContext.tsx # Manages Accounts AND Transactions (Monolithic context?)
├── components/
│   └── management/
│       └── AccountsList.tsx    # UI for listing/editing accounts
└── data/                       
    └── db.ts                   # Dexie schema for 'accounts'
```

## Implementation Strategy

### Data Loading
- Accounts are loaded via `dataProvider.getAccounts(ledgerId)`.
- They are stored in `accounts` state within `TransactionsContext`.

### CRUD Operations
- `addAccount`: Calls `dataProvider.addAccount`, then optimistic update or refetch.
- `updateAccount`: Logic to update name, type, etc.
- `deleteAccount`: Logic to remove account. **Critical**: Check if transactions are deleted or if `CASCADE` is handled by Dexie/Application logic.

### Balance Calculation
- Balance is likely computed derived from `transactions` array in memory, filtering by `account_id`.
