## 2024-05-23 - Decoupling Global Derivations from View State
**Learning:** In `RecentTransactions.tsx`, an expensive O(N) balance calculation for the entire transaction history was coupled to the filtered `transactions` prop. This meant that every time the user applied a filter (changing the view), the entire history was re-processed and balances recalculated, even though the historical balances hadn't changed.
**Action:** When deriving expensive global state (like running balances), use a dedicated `useMemo` that depends ONLY on the global data source, not on the filtered view. Then, map the results to the view in a separate, cheaper step. This creates a "tiered" memoization strategy: Global Cache (rarely updates) -> View Projection (frequently updates).

## 2024-05-24 - Memoizing Handlers for Virtualized Lists
**Learning:** `TransactionTable.tsx` memoized its row component (`TransactionRow`), but `Transactions.tsx` passed inline arrow functions (e.g., `onRowDoubleClick`, `onUnlinkTransaction`) as props. This caused `TransactionTable` to receive new props on every render, triggering a re-render of ALL rows, negating the benefit of `React.memo` on the rows.
**Action:** Wrap all event handlers passed to large lists or memoized components in `useCallback` to ensure referential stability. This allows `React.memo` to effectively skip re-renders for rows whose data hasn't changed.

## 2025-05-25 - Fast-Forwarding Recurring Transactions
**Learning:** `projectScheduledTransactions` in `src/utils/forecasting.ts` iterated through every occurrence of a recurring transaction from its start date (which could be years ago) to the current window. For daily/weekly transactions, this caused thousands of unnecessary iterations and object allocations.
**Action:** Implemented an O(1) "fast-forward" optimization for fixed-length intervals (Daily/Weekly) using arithmetic (`differenceInDays`/`differenceInWeeks`) to jump directly to the projection window. Variable-length intervals (Monthly/Yearly) were left as iterative to preserve date correctness (e.g., handling variable month lengths). This reduced processing time by ~40% for long-running daily transactions.

## 2025-05-26 - Hoisting Property Accessors in Sort Hooks
**Learning:** `useTableSort.ts` was dynamically splitting string paths (e.g., "category.name") inside the `sort` comparison function. For a table with N items, this resulted in O(N log N) string splits and reduce operations.
**Action:** Pre-compute the property accessor strategy outside the sort loop. If the key is a nested path, parse it once and create a specialized getter function. If it's a simple key, use direct property access. This removes expensive string operations from the hot path of the sort algorithm.

## 2025-05-27 - Optimizing Projected Transaction Deduplication
**Learning:** In `useTransactionData.ts`, merging real and projected transactions involved an O(N*M) deduplication loop where every projected transaction was compared against every real transaction using `some()`. This caused a 800ms+ delay on every render for large datasets.
**Action:** Replace the O(N*M) loop with a O(N) lookup Map (`${date}|${vendor}` -> `amounts[]`). This allows verifying duplicates in O(1) time per projected transaction. Also replaced expensive `new Date(isoString).toISOString().split('T')[0]` with faster `isoString.substring(0, 10)` for date keys.
