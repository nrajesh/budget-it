# Implementation Plan: Bug Fixes (028)

## Technical Context
We are resolving three separate bugs:
1. **Account Deletion Reappearance**: Caused by missing derived filters for soft-deleted entities in `TransactionsContext`.
2. **"Is this an account?" Checkbox**: An unnecessary UI element shown in `AddEditPayeeDialog` when adding an explicit account.
3. **Disappearing Transaction Chain Popup**: Native `window.confirm` behaving unreliably in Electron.

## Proposed Changes

### Bug 1: Account Deletion Reappearance
**File: `src/contexts/TransactionsContext.tsx`**
- Create derived `useMemo` arrays for `accounts`, `vendors`, and `categories` that filter out items whose IDs are present in the `hiddenEntityIds` map.
- Export these derived arrays from the context provider instead of the raw query data, mirroring how `transactions` and `scheduledTransactions` are handled.

### Bug 2: Remove Redundant Checkbox
**File: `src/components/dialogs/AddEditPayeeDialog.tsx`**
- Locate the rendering condition for the "Is this an account?" checkbox.
- Update it from `!(payee && payee.is_account)` to `!(payee && payee.is_account) && !isAccountOnly`.

### Bug 3: Persistent Transaction Chain Popup
**File: `src/pages/Transactions.tsx`**
- Remove `window.confirm` from `handleUnlinkTransaction`.
- Add state variables: `unlinkTransferId` (string | null) and `isUnlinkConfirmOpen` (boolean).
- Implement a `ConfirmationDialog` instance at the bottom of the component.
- When the unlink button is clicked, set the `unlinkTransferId` state and open the custom dialog. On confirmation, execute the unlink logic and close the dialog.

## Verification Plan

### Automated/Local Checks
- Run `pnpm lint`, `pnpm format:check`, and `tsc --noEmit` to ensure no syntax or type errors.
- Run `pnpm build` to verify the codebase builds successfully.

### Manual Verification
1. **Account Deletion**:
   - Go to Accounts (or Management). Add a test account.
   - Delete the test account. Navigate to Transactions, then back to Accounts immediately.
   - Verify the account does not reappear.
2. **Add Account Modal**:
   - Open the "Add Account" modal.
   - Verify the "Is this an account?" checkbox is entirely hidden.
3. **Transaction Chain Popup**:
   - Create a transfer between two accounts.
   - Click the "Unlink" icon on the transaction row.
   - Verify a stable custom modal appears asking for confirmation, and that confirming properly breaks the chain.
