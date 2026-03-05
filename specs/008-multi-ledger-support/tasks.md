# Tasks: Ledger (Multi-ledger Support)

**Input**: [spec.md](./spec.md)
**Status**: Completed

## Phase 1: Core Logic

- [x] T001 Define `Ledger` interface in `src/types/dataProvider.ts`
- [x] T002 Implement `getLedgers`, `addLedger`, `updateLedger`, `deleteLedger` in `src/data/dataProvider.ts`
- [x] T003 Create `LedgerContext` in `src/contexts/LedgerContext.tsx`

## Phase 2: Context Logic

- [x] T004 Implement `switchLedger` logic (LocalStorage persistence + Filter clearing)
- [x] T005 Implement `createLedger` logic
- [x] T006 Implement `deleteLedger` logic
- [x] T007 Implement Auto-selection logic on init

## Phase 3: UI Integration

- [x] T008 Integrate `useLedger` in `Sidebar` (for switching)
- [x] T009 Integrate `useLedger` in `Onboarding` (initial creation)
