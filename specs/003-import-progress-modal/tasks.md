# Tasks: Import Progress Modal

## Phase 1: Setup
- [x] Create feature branch `003-import-progress-modal` from `pre-prod`
- [x] Create `spec.md` with user stories and acceptance criteria
- [x] Create `plan.md` with implementation details

## Phase 2: Implementation
- [x] Import `GlobalProgressDialog` in `LedgerEntryPage.tsx`
- [x] Destructure `setOperationProgress` from `useTransactions()` hook
- [x] Add `setOperationProgress` calls to `handleMappingConfirmed` (CSV import) at stages: creating ledger (0%), accounts (15%), vendors (40%), categories (60%), transactions (80%), complete (100%)
- [x] Add `setOperationProgress` calls to `handleFileChange` (JSON import) at stages: importing (50%), complete (100%)
- [x] Add `setOperationProgress` calls to `handleImportEncryptedParams` (encrypted import) at stages: decrypting (25%), importing (50%), complete (100%)
- [x] Add error handling to clear progress on failure
- [x] Render `<GlobalProgressDialog />` in JSX return

## Phase 3: Verification
- [x] TypeScript compilation passes (`tsc --noEmit` — zero errors)
- [x] Browser testing: Progress modal appears during demo data generation on `/ledgers`
