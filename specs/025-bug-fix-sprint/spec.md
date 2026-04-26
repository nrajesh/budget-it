# Bug Fixes Spec - 014-carry-out-bug-fixes

## Problem Statement
Six user-reported bugs across the Vaulted Money application need to be resolved.

## Bug List

### Bug 1: Smart Budget Duplicate Creation
**Current**: Clicking "Create Budgets" in Smart Budget dialog creates duplicates without checking existing budgets.
**Goal**: Before creating, skip any budget where `(category_name + sub_category_name + frequency + is_goal)` already exists for this ledger.

### Bug 2: Auto-Schedule Not Reflected + Duplicates
**Current**: Auto-Schedule dialog says "10 schedules created" but none appear. Also possible duplicates if re-run.
**Goal**: After creation, the Scheduled Transactions list must refresh immediately. Duplicate detection: skip if `(vendor + account + category + sub_category + frequency)` already exists.

### Bug 3: Unintuitive Navigation Icons
**Current**: Transactions uses `Users`, Scheduled uses same `Calendar` as the Calendar page, Vendors uses `Phone`, Accounts and Currencies both use `Banknote`.
**Goal**: Choose distinct and semantically meaningful icons for each nav item.
| Item | Current | New |
|---|---|---|
| Transactions | `Users` | `Receipt` |
| Accounts | `Banknote` | `CreditCard` |
| Categories | `Tag` | `FolderTree` |
| Vendors | `Phone` | `Store` |
| Scheduled | `Calendar` (same as Calendar page) | `Clock` |
| Ledger/Settings | `User` | `BookOpen` |
| Budgets | `FileText` | `PiggyBank` |

### Bug 4: Grey Shading Behind Ledger Icon
**Current**: Both the ledger card icon (`bg-primary/10 rounded-xl`) and the sidebar footer avatar icon div have a grey/colored background that looks unclean.
**Goal**: Remove or minimize the background shading to avoid visual clutter.

### Bug 5: Small Mobile Buttons
**Current**: Some icon buttons in the app header may be too small for easy tapping on mobile.
**Goal**: Ensure all clickable icon buttons have at minimum a `h-10 w-10` touch target.

### Bug 6: No Theme Toggle on Ledger Select Screen + Export/Import
**Current**: Theme can only be toggled after selecting a ledger. LedgerEntryPage has no dark/light toggle.
**Goal**: Add a theme toggle to `LedgerEntryPage`. Theme preference via `next-themes` persists automatically in `localStorage`. Include `theme` key in export/import data so it transfers between devices.
