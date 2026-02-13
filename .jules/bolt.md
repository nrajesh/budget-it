## 2024-05-23 - Decoupling Global Derivations from View State
**Learning:** In `RecentTransactions.tsx`, an expensive O(N) balance calculation for the entire transaction history was coupled to the filtered `transactions` prop. This meant that every time the user applied a filter (changing the view), the entire history was re-processed and balances recalculated, even though the historical balances hadn't changed.
**Action:** When deriving expensive global state (like running balances), use a dedicated `useMemo` that depends ONLY on the global data source, not on the filtered view. Then, map the results to the view in a separate, cheaper step. This creates a "tiered" memoization strategy: Global Cache (rarely updates) -> View Projection (frequently updates).

## 2024-05-24 - Memoizing Handlers for Virtualized Lists
**Learning:** `TransactionTable.tsx` memoized its row component (`TransactionRow`), but `Transactions.tsx` passed inline arrow functions (e.g., `onRowDoubleClick`, `onUnlinkTransaction`) as props. This caused `TransactionTable` to receive new props on every render, triggering a re-render of ALL rows, negating the benefit of `React.memo` on the rows.
**Action:** Wrap all event handlers passed to large lists or memoized components in `useCallback` to ensure referential stability. This allows `React.memo` to effectively skip re-renders for rows whose data hasn't changed.
