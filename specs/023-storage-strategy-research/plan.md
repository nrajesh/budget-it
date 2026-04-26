# Technical Implementation Plan

## Technical Context
The user wants to bring their own API key (BYOK) for an AI provider (OpenAI, Gemini, Perplexity) to automatically guess categories and sub-categories for vendors. This must be a manual action triggered by the user to avoid unintended token usage. 

Because Vaulted Money associates Categories directly with Transactions (not strictly with Vendors), the Auto-Categorize feature will be exposed inside the Transaction Form (`AddEditTransactionDialog.tsx`). When a user enters a Vendor name, they can click "Auto-Categorize ✨" to have the AI suggest the best Category & Sub-Category based on their existing categories.

## Proposed Changes

### Core AI Logic
#### [NEW] `src/hooks/useAIConfig.ts`
- Hook to manage AI preferences from `localStorage`.
- Stores `ai_provider` (string enum) and `ai_api_key` (string).

#### [NEW] `src/hooks/useAutoCategorize.ts`
- Hook that utilizes `useAIConfig` and reads existing categories via `useTransactions()`.
- Exposes an `autoCategorize(vendorName)` function.
- Constructs a JSON-mode structured prompt for the selected AI provider (OpenAI, Gemini, Perplexity).
- Sends a simple `fetch` request, parses the response, and returns `{ categoryName, subCategoryName }`.

### User Interface - Settings
#### [MODIFY] `src/pages/SettingsPage.tsx`
- Add a new `ThemedCard` for "AI Integrations".
- Add a Select dropdown for Provider (OpenAI, Gemini, Perplexity, None).
- Add a password `Input` for the API Key.
- Add an `Alert` with helpful links to provider documentation for securing API keys.

### User Interface - Trigger Actions
#### [MODIFY] `src/components/dialogs/AddEditTransactionDialog.tsx`
- In the Vendor row or near the Category field, append a small action button with a ✨ icon.
- When clicked, if a vendor name is provided, call `autoCategorize(vendorName)`, then automatically update the form's `category` and `sub_category` fields.
- Show a loading spinner during the fetch and toast a success/error message on completion.

---

## Verification Plan

### Automated/Local Checks
- Format Check: `pnpm format:check`
- Lint: `pnpm lint`
- Type Check: `pnpm exec tsc --noEmit`
- Build: `pnpm build`

### Manual Verification
1. **Settings Configuration**:
   - Navigate to **Settings** > **AI Integrations**.
   - Select "Gemini" and enter a valid API key. (Test with invalid key to ensure graceful error handling).
2. **Auto-Categorize Action**:
   - Navigate to **Transactions** > Click **Add Transaction**.
   - Type "Starbucks" into the Vendor field.
   - Click the **Auto-Categorize ✨** button.
   - Verify the Category field automatically updates to "Food" or similar, based on your existing categories context.
3. **Usage Guardrails**:
   - Confirm that API calls are *only* fired upon explicitly clicking the auto-categorize button.
