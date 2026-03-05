# Implementation Plan: Budgeting

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**State**: `LocalDataProvider.getBudgetsWithSpending`
**Database**: Dexie.js table `budgets`

## Project Structure

### Source Code Impact

```text
src/
├── providers/
│   └── LocalDataProvider.ts   # Contains getBudgetsWithSpending logic
```

## Implementation Strategy

### Spending Calculation
- `getBudgetsWithSpending` is an "expensive" operation.
- It iterates all budgets, queries transactions for each budget's criteria (date range, category, account scope), and sums the amount.
- **Optimization**: This is done in the data provider, but might be slow with many budgets/transactions.

### Recurrence
- Budgets have a `period` field. Logic to "roll over" or create new budget periods is likely handled in the UI or by simply updating dates.
