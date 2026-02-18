# Import Progress Modal — Implementation Plan

## Problem

The `LedgerEntryPage` (at `/ledgers`) renders **outside** the `Layout` component. The existing `GlobalProgressDialog` is only mounted in `Layout.tsx` (line 515), so when users trigger demo data generation, CSV import, or JSON import from the Ledger Select screen, no progress modal appears despite `operationProgress` being set in `TransactionsContext`.

## Proposed Changes

### LedgerEntryPage Component

#### [MODIFY] [LedgerEntryPage.tsx](file:///Users/nrajesh/Github/budget-it/src/pages/LedgerEntryPage.tsx)

**Change 1: Render `GlobalProgressDialog` on this page**

Since this page sits outside `Layout`, we need to add `<GlobalProgressDialog />` directly. The component already reads from `TransactionsContext` which wraps this page (see `App.tsx` lines 50-101).

```diff
+import { GlobalProgressDialog } from "@/components/dialogs/GlobalProgressDialog";
```

Add `<GlobalProgressDialog />` at the bottom of the return JSX, just before `</div>`.

**Change 2: Add progress tracking to `handleMappingConfirmed` (CSV import)**

Wrap the multi-step CSV import logic with `setOperationProgress` calls at each stage:
- Stage 1 (0%): "Creating ledger..."
- Stage 2 (15%): "Setting up accounts..." 
- Stage 3 (40%): "Setting up vendors..."
- Stage 4 (60%): "Setting up categories..."
- Stage 5 (80%): "Inserting transactions..."
- Stage 6 (100%): "Complete"

Import `setOperationProgress` from `useTransactions()` (already imported on line 3).

**Change 3: Add progress tracking to `handleFileChange` (JSON import)**

Add progress calls around the `dataProvider.importData()` call:
- Start (0%): "Parsing backup file..."
- Middle (50%): "Importing data..."
- Complete (100%): "Import complete"

**Change 4: Add progress tracking to `handleImportEncryptedParams` (encrypted import)**

Add progress calls around decryption and import:
- Start (0%): "Decrypting backup..."
- Middle (50%): "Importing data..."
- Complete (100%): "Import complete"

---

> [!IMPORTANT]
> No changes needed to `GlobalProgressDialog.tsx`, `TransactionsContext.tsx`, or `DataManagementPage.tsx`. We are purely reusing the existing progress infrastructure on a page that was missing it.

## Verification Plan

### Browser Testing

Since this is a UX feature (visual progress modal), the primary verification is visual/interactive:

1. **Start the dev server**: `cd /Users/nrajesh/Github/budget-it && npm run dev`
2. **Navigate** to `http://localhost:5173/ledgers`
3. **Test Demo Data Generation**:
   - Click "Generate Data" → confirm
   - Verify: A modal popup should appear with "Generating Demo Data" title, a spinning loader, stage text, progress bar, and percentage counter — matching the screenshot the user shared
   - The modal should auto-close when complete
4. **Test CSV Import** (if a test CSV file is available):
   - Click "Import Transactions CSV" → select file → fill ledger details → map columns → confirm
   - Verify: A modal popup appears showing import stages
5. **Test JSON Import**:
   - Click "Import Backup" → select a JSON backup file
   - Verify: A modal popup briefly appears during import

### Build Verification

Run `npm run build` to ensure no TypeScript errors are introduced since we're only adding imports and function calls with existing types.
