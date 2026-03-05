# Implementation Plan: Ledger (Multi-ledger Support)

**Branch**: `main`
**Date**: 2026-02-15
**Spec**: [spec.md](./spec.md)

## Technical Context

**Language/Version**: TypeScript 5.x
**State**: React Context (`LedgerContext`) + LocalStorage (Persistence)
**Database**: Dexie.js (via `DataProviderContext`)

## Project Structure

### Source Code Impact

```text
src/
├── contexts/
│   └── LedgerContext.tsx      # Main logic: Multi-ledger state, switch, create, delete
├── providers/
│   └── DataProviderContext.tsx # Interface to DB
└── types/
    └── dataProvider.ts        # Ledger interface definition
```

## Implementation Strategy

### Logic Flow
1.  **Initialization**: `useEffect` in `LedgerProvider` loads all ledgers from DB.
2.  **Selection**: Checks `localStorage.getItem("activeLedgerId")`. If found, sets it as active.
3.  **Fallback**: If no stored ID, defaults to the first available ledger (unless `userLoggedOut` flag is set).
4.  **switching**: `switchLedger` updates `activeLedger`, persists ID to `localStorage`, clears all filter-related `localStorage` keys, and forces a window reload (`window.location.href = '/'`) to ensure clean state.

### Data Isolation
- Although `Dexie` might contain all data, the frontend enforces isolation by strictly querying data associated with the `activeLedger` ID (enforced by `useTransactions` and `useDataProvider` hooks).
