# Feature Specification: Auto-Categorize Vendors using AI

**Feature Branch**: `012-identify-best-way`  
**Created**: 2026-03-03
**Status**: Draft  
**Input**: User description: "identify best way to implement https://github.com/nrajesh/budget-it/issues/96 without compromising fundamentals..."

## Problem Statement
When importing transaction data or adding new data, vendors often lack an associated category or sub-category. It is tedious for users to manually associate a vendor to a category/sub-category combination every single time, particularly when starting from scratch.

## Goals & Non-Goals

### Goals
- Allow users to automatically categorize vendors using a cloud AI model (OpenAI, Gemini, Perplexity).
- Maintain user privacy and control by employing a "Bring Your Own Key" (BYOK) model.
- Prevent unintended API costs by triggering the categorization explicitly through user action (e.g., an "Auto-Categorize" button) rather than in the background.
- Ensure accuracy by providing the user's existing categories/sub-categories to the AI model as context.
- Provide clear setup instructions and documentation links for obtaining API keys.

### Non-Goals
- Local LLM inference (e.g., Transformers.js or web-llm) is excluded due to hardware constraints and download size.
- Background asynchronous categorization that automatically consumes tokens upon import.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure AI Settings (Priority: P1)

As a user, I want to be able to configure my AI provider and API key in settings, with helpful links to provider documentation, so that I can control my own API usage.

**Why this priority**: Core requirement to support the BYOK model while maintaining the app's local-first philosophy.

**Independent Test**: Can be fully tested by navigating to settings, selecting a provider, entering an API key, and successfully saving it and verifying the UI feedback.

**Acceptance Scenarios**:

1. **Given** the user navigates to the Settings page, **When** they view the new "AI Integrations" section, **Then** they see a dropdown to select a provider (OpenAI, Gemini, Perplexity) and an input field for the API key.
2. **Given** the user selects a provider, **When** the provider is selected, **Then** they see a helpful link to that provider's API key documentation.

---

### User Story 2 - Trigger Auto-Categorization (Priority: P1)

As a user managing transactions or vendors, I want to explicitly click an "Auto-Categorize" button to categorize uncategorized vendors using my configured AI, so that I don't unknowingly consume API tokens.

**Why this priority**: The primary solution to Issue #96.

**Independent Test**: Can be tested by selecting an uncategorized vendor and triggering the action natively or via a mock API.

**Acceptance Scenarios**:

1. **Given** a vendor with missing categories, **When** the user clicks "Auto-Categorize", **Then** the system sends the vendor name alongside existing categories to the AI, and the UI updates with the predicted category.
2. **Given** the user has not configured an API key, **When** they attempt to auto-categorize, **Then** they are prompted to configure their settings first.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST provide a settings UI to select an AI provider (OpenAI, Gemini, Perplexity) and input an API key.
- **FR-002**: System MUST securely store the API key locally, preventing exposure or telemetry to third-party services other than the chosen AI provider.
- **FR-003**: System MUST provide a manual "Auto-Categorize" button/action in the relevant Vendor or Transaction views.
- **FR-004**: System MUST inject the user's existing list of categories as context in the prompt sent to the chosen AI provider.
- **FR-005**: System MUST display links to provider documentation for obtaining API keys.
- **FR-006**: System MUST fail gracefully with clear error messages if the AI provider returns an error (e.g., invalid key, rate limit, timeout).

### Standard Requirements (Budget It)
- **FR-STD-01**: Feature MUST be fully responsive and usable on mobile (375px+) and desktop.
- **FR-STD-02**: Feature MUST support both Light and Dark modes using Tailwind CSS variables.
- **FR-STD-03**: Feature MUST work offline without any network dependency (unless explicitly stating otherwise). *Note: This feature inherently requires network access for API calls, but the rest of the application must not crash offline.*
- **FR-STD-04**: Feature MUST be compatible with both Web and Electron environments.
- **FR-STD-05**: All user inputs MUST be validated using Zod schemas.

### Component Impact
- **New Components**: settings section for AI Providers, Auto-Categorize action button/service.
- **Modified Components**: Vendor/Transaction forms or lists, existing Settings panel.
- **Context Updates**: AppSettings store for the API key and chosen provider.

### Key Entities (Budget It Core)
- **AI Integration**: A new configuration entity containing the user's `provider` (enum: OPENAI, GEMINI, PERPLEXITY) and `apiKey` (string).

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Users can successfully set up an external AI provider and API key in under 2 minutes.
- **SC-002**: Auto-categorization accurately maps a given vendor to an existing category if a logical match exists.
- **SC-003**: ZERO token consumption occurs unless the user explicitly triggers auto-categorization manually.
