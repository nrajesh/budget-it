# Budget It Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-28

## Active Technologies
- TypeScript 5.x + React 18, Vite 5, Capacitor 6, Tailwind CSS, TanStack Query, Dexie.js (IndexedDB) (011-implement-capacitor-native)
- For mobile development, follow structural, security, and performance rules defined in `documentation/IOS_RULES.md` and `documentation/ANDROID_RULES.md`.

- **Core**: TypeScript 5.x, React 18, Vite 5
- **Desktop**: Electron (Main/Preload/Renderer)
- **State**: TanStack Query (Server State), Context API (Client State)
- **Database**: Dexie.js (IndexedDB wrapper)
- **Styling**: Tailwind CSS, Shadcn UI (Radix Primitives)
- **Validation**: Zod
- **Testing**: Vitest, React Testing Library

## Project Structure

```text
budget-it/
├── electron/                  # Electron-specific code
│   ├── main.ts                #   Main process
│   └── preload.ts             #   Preload script
├── src/
│   ├── components/            # UI Components
│   │   ├── ui/                #   Shadcn primitives (Generic)
│   │   └── [feature]/         #   Feature-specific components
│   ├── contexts/              # Global state (React Context)
│   ├── hooks/                 # Custom React hooks (Logic)
│   ├── pages/                 # Route components (Pages)
│   ├── types/                 # TypeScript definitions (Zod schemas)
│   ├── utils/                 # Helper functions
│   └── data/                  # Database configuration
└── [config files]             # package.json, vite.config.ts, etc.
```

## Commands

- **Web Dev**: `pnpm dev`
- **Electron Dev**: `pnpm run electron:dev`
- **Build Web**: `pnpm build`
- **Build Desktop**: `pnpm run electron:build`
- **Test**: `pnpm test` (Logic) / `pnpm test:coverage`
- **Lint**: `pnpm lint` / `pnpm format:check`

## Code Style

- **TypeScript**: Strict mode enabled. No `any`.
- **React**: Functional components and Hooks only.
- **Styling**: Utility-first (Tailwind). No CSS files except `globals.css`.
- **Imports**: Absolute imports `@/...` where configured.
- **Async**: `async/await` preferred over `.then()`.
- **State**: Prefer `useQuery` for async data, Context for global UI state.

## Recent Changes
- 011-implement-capacitor-native: Added TypeScript 5.x + React 18, Vite 5, Capacitor 6, Tailwind CSS, TanStack Query, Dexie.js (IndexedDB)

- 010-implement-continuity-feature: Added TypeScript 5.x + React 18, Vite 5, Electron, Tailwind CSS, TanStack Query, Dexie.js (IndexedDB)

<!-- MANUAL ADDITIONS START -->
- **Calendar Module**: Added Calendar module to the app to allow users to view their transactions in a calendar view.
<!-- MANUAL ADDITIONS END -->
