# Implementation Plan: Transaction Management

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**State**: `TransactionsContext` (The "God Context" for this app)
**Database**: Dexie.js table `transactions`
**Logic**: Complex logic for Transfers and Undo resides in the Context.

## Project Structure

### Source Code Impact

```text
src/
├── contexts/
│   └── TransactionsContext.tsx # CONTAINS CORE LOGIC: Add, Update, Delete, Undo, Transfer Sync
├── components/
│   └── dialogs/
│       ├── AddTransactionDialog.tsx
│       └── EditTransactionDialog.tsx
└── data/
    └── db.ts                   # Dexie schema
```

## Implementation Strategy

### Add Transaction
- `addTransaction` function in Context.
- Detects if `vendor` matches an known `account.name` -> treats as Transfer.
- **Transfer Logic**:
    - Generates `transfer_id`.
    - Creates Source Transaction (Negative Amount).
    - Creates Destination Transaction (Positive Amount).
    - Writes both to DB.

### Update Transaction
- `updateTransaction` function in Context.
- Checks for `transfer_id`.
- If found, finds the "Pair" transaction and updates it too (swapping account/vendor, inverting amount).

### Undo Deletion
- Uses a `hiddenTransactionIds` Set in React State to "hide" items immediately.
- Sets a `setTimeout` (7s) to perform actual DB delete.
- If Undo clicked: clears timeout, removes ID from hidden set.
- If Timeout fires: calls `dataProvider.deleteTransaction`.

### Performance
- `useQuery` fetches all transactions for active ledger.
- **Note**: This might scale poorly if ledger has 10k+ transactions. Pagination might be needed later.
