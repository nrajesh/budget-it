# Implementation Plan: Scheduled Transactions

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**State**: `TransactionsContext` (`scheduledTransactions` array)
**Logic**: `calculateNextDate` utility, `processScheduledTransactions` function.

## Project Structure

### Source Code Impact

```text
src/
├── components/
│   └── scheduled-transactions/
│       ├── ScheduledTransactionsList.tsx
│       └── ScheduledTransactionCard.tsx
├── contexts/
│   └── TransactionsContext.tsx        # Logic for processing and rolling over dates
```

## Implementation Strategy

### Processing Logic
1.  **Check**: On app load (or manual trigger), find items where `next_date <= today`.
2.  **Action**:
    - Create new `Transaction` from `ScheduledTransaction` template.
    - Update `ScheduledTransaction.next_date` using `calculateNextDate`.
    - Save both.

### Projection
- "Projected" transactions in lists/calendars are often generated on-the-fly by iterating `scheduledTransactions` and generating N future instances.
