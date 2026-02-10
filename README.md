# Personal Finance Tracker

[![CircleCI][circleci-badge]][circleci-url]
[![Vercel Deployment][vercel-status-badge]][vercel-status-url]
[![Last Commit][last-commit-badge]][last-commit-url]
[![Google Gemini][gemini-badge]][gemini-url]
[![License: MIT][license-badge]][license-url]
[![TypeScript][typescript-badge]][typescript-url]
[![React][react-badge]][react-url]
[![Electron][electron-badge]][electron-url]
[![Vite][vite-badge]][vite-url]
[![TailwindCSS][tailwind-badge]][tailwind-url]


A privacy-focused, local-first personal finance application designed to help you track spending, manage budgets, and gain insights into your financial health without sending your data to the cloud.

![Dashboard Preview](docs/dashboard-preview.png)

## 🌟 Key Features

- **Local-First & Private**: All your data stored securely in your browser using IndexedDB. No external servers see your financial data.
- **Multi-Ledger Support**: Create and manage separate ledgers (Personal, Business, Joint) within a single app.
- **Comprehensive Budgeting**: Set monthly, quarterly, yearly, or one-time budgets.
- **Transaction Management**: Easy tracking with categories, sub-categories, vendors, and account groups.
- **Smart Deduplication**: Intelligent import logic prevents duplicate transactions even when projections overlap.
- **Instant Backup & Restore**: Import encrypted or plain JSON backups instantly without page reloads.
- **Automated Backups**: Configure automatic backups to run in the background (Electron only) or on a schedule using the File System Access API.
- **Conversational Search**: Natural language filtering for transactions, categories, and dates.
- **Smart Analytics**: Visual breakdowns of income, expenses, and savings trends.
- **Financial Pulse**: A premium dashboard view for high-level financial health monitoring.

## 🏗️ System Architecture

This application is built as a Single Page Application (SPA) with a focus on client-side processing and storage.

### Tech Stack
- **Frontend Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Local Database**: [Dexie.js](https://dexie.org/) (Wrapper for IndexedDB)
- **Routing**: [React Router](https://reactrouter.com/)

### Project Structure
The codebase is organized to promote modularity and reusability:

- `src/components/`: Reusable UI components.
  - `dialogs/`: Modal dialogs (e.g., Add Transaction, Confirmation).
  - `filters/`: Search and filter components.
  - `feedback/`: Loading spinners, progress bars, and alerts.
  - `transactions/`: Transaction-specific components (tables, headers).
- `src/pages/`: Main application pages (Dashboard, Transactions, Reports).
- `src/hooks/`: Custom React hooks for logic and state management.
- `src/contexts/`: React Context providers for global state (Transactions, Theme, Ledger).
- `src/utils/`: Helper functions and utilities.

### Data Flow
1. **Local Storage**: The app uses `Dexie.js` to interface with the browser's IndexedDB. This acts as the primary data source.
2. **Multi-Ledger Scoping**: All data operations are scoped to the active `ledger_id`, allowing complete separation of distinct financial datasets.
3. **State Sync**: `TanStack Query` manages asynchronous state, caching data from Dexie and ensuring the UI stays in sync with the local database.
4. **Optimistic Updates**: UI updates immediately upon user action, providing a snappy experience while data persists in the background.

## 🚀 Getting Started

Follow these steps to get the application running on your local machine.

### Prerequisites
- **Node.js**: Version 18 or higher recommended.
- **Package Manager**: [pnpm](https://pnpm.io/) is **strongly recommended** as the project uses `pnpm-lock.yaml` and scripts rely on it.
  - *If you don't have pnpm installed:* `npm install -g pnpm`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd budget-it
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

### 🌐 Running Web Version

Start the development server for the browser-based version:
```bash
pnpm dev
# or: npm run dev
```
Open your browser and navigate to `http://localhost:8081`.

### 🖥️ Running Desktop Version (Electron)

This application can also run as a standalone desktop app on macOS, Windows, and Linux.

To start the Electron development version:
```bash
pnpm run electron:dev
# or: npm run electron:dev
```

**⚠️ Important Notes:**
- **Do NOT run `pnpm dev` manually before this.** The `electron:dev` command automatically starts the Vite dev server and the Electron app concurrently. Running them separately may cause port conflicts.
- **First Run**: The first time you run this, it may take a moment to compile Main/Preload scripts.
- **Mobile Support**: The **Electron** desktop app *cannot* run on iPhone or Android devices. For mobile access, you must host the Web Version and access it via a mobile browser.

### Building for Production

To build the web version:
```bash
pnpm build
```
Artifacts will be in `dist/`.

To build the desktop application (Mac/Windows/Linux):
```bash
pnpm run electron:build
```
Artifacts (DMG, AppImage, EXE) will be in `dist-electron/` or `release/`.

## 🛠️ Development Guide

### Adding New Components
1. **Choose the Right Directory**:
   - `src/components/ui`: Generic, reusable UI primitives (buttons, inputs).
   - `src/components/features`: Complex feature-specific components.
   - `src/components/layout`: Layout wrappers.

2. **Guidelines**:
   - Use **functional components** with TypeScript interfaces.
   - Style using **Tailwind CSS** utility classes.
   - Ensure responsive design (mobile-first).
   - Add JSDoc comments for complex logic or props.

### State Management
- Use `useTransactions()` for global financial data.
- Use local `useState` for UI-only state (dialog open/close).
- Use `useQuery` for any async data fetching.

### Testing
- Run unit and integration tests with `pnpm test` (Vitest).
- Run lint checks with `pnpm lint`.

## 📦 Deployment

### Deploy Web Version to Vercel
This project is optimized for Vercel.
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel deploy` in the project root.
3. Follow the prompts to ship your local-first finance tracker to the web.

Since the app is client-side only (local-first), it can be hosted on any static site provider like Vercel, Netlify, or GitHub Pages.

## 🛡️ Privacy Note
This application runs entirely in your browser (or local Electron instance). Clearing your browser cache or site data will remove your financial data unless you have exported a backup. Always keep backups of your important data.

<!-- Badge Links -->
[circleci-badge]: https://circleci.com/gh/nrajesh/budget-it.svg?style=shield
[circleci-url]: https://circleci.com/gh/nrajesh/budget-it
[vercel-status-badge]: https://img.shields.io/vercel/v/budget-it/production?style=flat&logo=vercel&logoColor=white
[vercel-status-url]: https://budget-it.vercel.app/
[last-commit-badge]: https://img.shields.io/github/last-commit/nrajesh/budget-it?style=flat&logo=github&logoColor=white
[last-commit-url]: https://github.com/nrajesh/budget-it/commits/main
[gemini-badge]: https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat&logo=google%20gemini&logoColor=white
[gemini-url]: https://gemini.google.com/
[license-badge]: https://img.shields.io/badge/License-MIT-yellow.svg


[license-url]: https://opensource.org/licenses/MIT
[typescript-badge]: https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[react-badge]: https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB
[react-url]: https://reactjs.org/
[electron-badge]: https://img.shields.io/badge/Electron-191970?style=flat&logo=Electron&logoColor=white
[electron-url]: https://www.electronjs.org/
[vite-badge]: https://img.shields.io/badge/Vite-646CFF?style=flat&logo=Vite&logoColor=white
[vite-url]: https://vitejs.dev/
[tailwind-badge]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white
[tailwind-url]: https://tailwindcss.com/