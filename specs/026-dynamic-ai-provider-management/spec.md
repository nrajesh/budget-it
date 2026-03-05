# Feature Specification - AI Provider Management

## Overview
Refactor the application's AI integration to support dynamic, user-managed AI providers. Instead of hardcoded configurations, users should be able to add, edit, and remove any OpenAI-compatible, Google Gemini, Anthropic, or Perplexity endpoint via the UI.

## Requirements
- **Dynamic Registry**: Store AI providers in a dedicated IndexedDB table.
- **BYOK (Bring Your Own Key)**: Allow users to provide their own API keys for any configured provider.
- **Security**: 
    - API keys must be stored in `localStorage` only.
    - API keys must be excluded from all database exports/backups.
- **UI Management**:
    - A new management module for AI Providers.
    - An updated Settings page for selecting a default provider and entering keys.
- **Refactored AI Logic**: AI features (auto-categorization) must utilize the dynamic registry and support custom endpoints.

## User Flow
1. User navigates to **Management > AI Providers**.
2. User adds a provider (e.g., "Local Ollama") with a Base URL (e.g., `http://localhost:11434/v1`).
3. User navigates to **Settings**, selects the "Local Ollama" provider, and optionally enters a key.
4. User uses AI features which now route requests to the configured local endpoint.

## Technical Constraints
- Must update SQLite/IndexedDB schema.
- Must handle differing API formats (OpenAI vs Gemini vs Anthropic).
- UI must be responsive and follow existing design patterns (Shadcn, Lucide).
