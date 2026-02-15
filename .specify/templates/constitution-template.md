# Budget It Constitution

## Core Principles

### I. Privacy First (Non-Negotiable)
Data never leaves the user's device. All persistence must be local (IndexedDB via Dexie.js). No cloud sync, no analytics trackers, no external API calls without explicit user consent (and even then, only for non-sensitive data like exchange rates).

### II. Local-First & Offline-Capable
The application must be fully functional without an internet connection. All assets must be bundled or cached. Use `TanStack Query` for state management with optimistic updates to ensure a snappy UI regardless of disk I/O latency.

### III. Platform Agnostic Core
The core logic (hooks, contexts, utils) must be shared between the Web and Electron versions. Electron-specific code resides strictly in `electron/` or uses the `window.electron` bridge.

### IV. Component Driven UI
UI development follows a component-driven approach using `Shadcn UI` and `Tailwind CSS`. New components should be placed in `src/components/ui` (primitives) or `src/components/<feature>` (feature-specific). Components must be responsive (mobile-first).

### V. Type Safety
TypeScript strict mode is enforced. No `any` types allowed without strong justification. Zod schemas should be used for validation where appropriate.

## Technology Stack

- **Core**: TypeScript, React, Vite
- **Desktop**: Electron
- **State**: TanStack Query, React Context
- **Database**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS, Shadcn UI
- **Routing**: React Router

## Development Workflow

### 1. Spec-Driven
All features start with a specification (`spec.md`) and an implementation plan (`plan.md`).

### 2. Quality Gates
- **Linting**: `pnpm lint` must pass.
- **Formatting**: `pnpm format:check` must pass.
- **Testing**: `pnpm test` (Vitest) for logic.
- **Build**: `pnpm build` must succeed for both Web and Electron targets.

## Governance

This constitution defines the immutable laws of the Budget It codebase. Changes to these principles require a team-wide RFC and unanimous approval.

**Version**: 1.0.0 | **Ratified**: 2026-02-15
