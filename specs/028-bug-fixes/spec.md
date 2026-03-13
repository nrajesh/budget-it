# Feature Specification: Bug Fixes (028)

## Problem Statement
There are three identified bugs in the application:
1. Deleted accounts reappear after navigating away and coming back. This is likely caused by the data provider automatically recreating accounts that are still referenced by existing transactions.
2. The "Add Account" modal has a redundant "Is this an Account?" checkbox which makes no sense in this context.
3. The "Unlink Transfer" action in `TransactionTable.tsx` displays a native browser `window.confirm` popup, which behaves improperly in the Electron environment (keeps disappearing).

## Goals
- Fix the bug where deleted accounts reappear.
- Remove the redundant checkbox from the "Add Account" modal.
- Replace the native `window.confirm` for breaking transaction chains with a stable UI component (e.g., custom confirmation dialog).

## Non-Goals
- Refactoring the entire data provider or transaction logic.
- Adding new feature enhancements to the "Add Account" modal.

## User Stories
- As a user, when I delete an account, it should stay deleted.
- As a user, when I add an account, I shouldn't be asked confusing questions like "Is this an account?".
- As a user, when I click to unlink a transfer, the confirmation dialog should stay visible until I make a choice.

## Functional Requirements
1. **Account Deletion**: Ensure that `deletePayee` properly removes the account and its references, or the frontend does not recreate it on reload if transactions still exist (or prompting the user to delete/reassign transactions).
2. **Add Account Modal**: In `AddEditPayeeDialog.tsx`, when `isAccountOnly` is true, the `is_account` checkbox must not be rendered.
3. **Unlink Transaction Dialog**: In `Transactions.tsx` or `TransactionTable.tsx`, replace `window.confirm("Are you sure you want to unlink these transactions?")` with a `ConfirmationDialog` component that works reliably in the Electron app.

## Non-Functional Requirements
- Maintain existing test coverage and ensure UI consistency.
- The confirmation dialog must be accessible and responsive.
