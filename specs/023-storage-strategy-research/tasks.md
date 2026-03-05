# Implementation Tasks: Auto-Categorize Vendors using AI

## Dependencies
- Phase 2 must complete before Phase 3 and Phase 4.

## Phase 1: Setup
- [x] T001 Define configuration types for AI providers (OpenAI, Gemini, Perplexity) in `src/hooks/useAIConfig.ts` or a new types file.

## Phase 2: Foundational
- [x] T002 Implement `useAIConfig` in `src/hooks/useAIConfig.ts` to manage API key and provider from `localStorage`.
- [x] T003 Implement `useAutoCategorize` logic in `src/hooks/useAutoCategorize.ts` to format prompts and handle API calls to chosen providers.

## Phase 3: US1 - Configure AI Settings
**Goal**: Allow user to configure their AI provider and API key.
- [x] T004 [US1] Update `src/pages/SettingsPage.tsx` with AI Integrations Card, dropdown, and input field.

## Phase 4: US2 - Trigger Auto-Categorization
**Goal**: Allow user to explicitly invoke the AI categorization on the transaction form.
- [x] T005 [US2] Update `src/components/dialogs/AddEditTransactionDialog.tsx` to add "Auto-Categorize ✨" button next to Categories/Vendor fields.
- [x] T006 [US2] Wire the button to `useAutoCategorize` and auto-fill `category` and `sub_category` in the form.

## Phase 5: Polish & Cross-Cutting Concerns
- [x] T007 Verify offline state handles AI requests gracefully (disables button or shows clear offline error).
- [x] T008 [P] Check standard UX patterns: loading spinners during fetch, success/error toast notifications.
