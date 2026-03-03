# Budget It Constitution

## Core Principles

### I. Privacy First
No data leaves the device unless explicitly exported to a file by the user. The application must not send telemetry, analytics, or user financial data to any external server without explicit, granular consent.

### II. Local-First & Offline Capable
The application must function 100% offline. All financial data, transactions, and settings are stored locally using IndexedDB (via Dexie.js). Network connectivity should only be required for explicit external integrations (e.g., fetching exchange rates) and must fail gracefully when offline.

### III. Component-Driven UI
The user interface is built using React, Shadcn/UI (Radix Primitives), and Tailwind CSS. Components must prioritize reusability, accessibility, and responsiveness across both desktop and mobile form factors. All UI must support Light and Dark modes natively.

### IV. Cross-Platform Native Experience
The application targets Web, Desktop (via Electron), and Mobile (via Capacitor). Features must be designed to feel native on each platform, respecting platform conventions for navigation, gestures, and layout.

### V. Specification-Driven Development
All feature development must begin with a rigorous specification phase. Coding only begins after the "What" and "How" have been fully defined and agreed upon in the `spec.md` and `plan.md` documents. The `/speckit.feature` workflow governs this lifecycle.

## Technical & Platform Constraints

The development of this project must rigorously adhere to platform-specific rule files located in the `documentation/` directory. Specifically:
- **iOS Development**: MUST fully comply with `documentation/IOS_RULES.md`.
- **Android Development**: MUST fully comply with `documentation/ANDROID_RULES.md`.
- **Desktop Development**: Electron main process must remain isolated; UI must communicate via secured Context Bridge IPC.

Failure to observe these guidelines is a violation of the constitution.

## Quality & Workflow Gates

1. **Strict Typing & Validation**: TypeScript strict mode is mandatory. No `any` types. Input validation must be handled via Zod schemas at system boundaries.
2. **Testing**: Unit tests (Vitest) and UI tests (React Testing Library) are required for core business logic and critical user flows. A Red-Green-Refactor cycle should be preferred.
3. **State Management**: Use TanStack Query for asynchronous operations (including local IndexedDB interactions) and React Context for global UI state.
4. **Formatting**: Code must adhere to configured ESLint and styling policies.

## Governance

This Constitution supersedes all other practices. Amendments to this document must be documented, approved, and accompanied by a migration plan if introducing breaking changes to the workflow. All Pull Requests and spec reviews must verify compliance with these principles. For runtime development guidance, refer to `documentation/AGENTS.md` and `.agent/rules/specify-rules.md`.

**Version**: 1.1.0 | **Ratified**: 2024-01-01 | **Last Amended**: 2026-03-02
