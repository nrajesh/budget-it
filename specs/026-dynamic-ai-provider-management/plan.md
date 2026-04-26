# Implementation Plan - AI Provider Management

## Goal
Transition from a static, code-based AI provider configuration to a dynamic, user-configurable system stored in the database.

## Proposed Changes

### Data Layer
- [MODIFY] [dexieDB.ts](file:///Users/nrajesh/Github/vaulted-money/src/lib/dexieDB.ts): Add `ai_providers` table.
- [MODIFY] [LocalDataProvider.ts](file:///Users/nrajesh/Github/vaulted-money/src/providers/LocalDataProvider.ts): Implement CRUD for AI providers; update export/import logic to exclude sensitive keys.

### Hooks & Logic
- [MODIFY] [useAIConfig.ts](file:///Users/nrajesh/Github/vaulted-money/src/hooks/useAIConfig.ts): Transition to fetching config from DB + localStorage.
- [MODIFY] [useAutoCategorize.ts](file:///Users/nrajesh/Github/vaulted-money/src/hooks/useAutoCategorize.ts): Handle dynamic endpoints and multi-provider API formats.

### UI Components
- [NEW] [AIProviderManagement.tsx](file:///Users/nrajesh/Github/vaulted-money/src/components/management/AIProviderManagement.tsx): Main dashboard for providers.
- [NEW] [AddEditAIProviderDialog.tsx](file:///Users/nrajesh/Github/vaulted-money/src/components/management/AddEditAIProviderDialog.tsx): Form for provider configuration.
- [MODIFY] [SettingsPage.tsx](file:///Users/nrajesh/Github/vaulted-money/src/pages/SettingsPage.tsx): Add dynamic selection and key management.
- [MODIFY] [Layout.tsx](file:///Users/nrajesh/Github/vaulted-money/src/components/Layout.tsx): Add sidebar navigation.

## Verification Plan
- Verify CRUD operations for AI Providers.
- Confirm API keys are isolated to localStorage.
- Test auto-categorization with different provider types (OpenAI, Gemini).
- Validate that exported JSON does not contain API keys.
