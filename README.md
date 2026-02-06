# Personal Finance Tracker

A privacy-focused, local-first personal finance application designed to help you track spending, manage budgets, and gain insights into your financial health without sending your data to the cloud.

![Dashboard Preview](docs/dashboard-preview.png)

## 🌟 Key Features

- **Local-First & Private**: All your data stored securely in your browser using IndexedDB. No external servers see your financial data.
- **Multi-Ledger Support**: Create and manage separate ledgers (Personal, Business, Joint) within a single app.
- **Comprehensive Budgeting**: Set monthly, quarterly, yearly, or one-time budgets.
- **Transaction Management**: Easy tracking with categories, sub-categories, vendors, and account groups.
- **Smart Deduplication**: Intelligent import logic prevents duplicate transactions even when projections overlap.
- **Instant Backup & Restore**: Import encrypted or plain JSON backups instantly without page reloads.
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
- **Package Manager**: pnpm (preferred), npm, or yarn.

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

### Running Locally

Start the development server:
```bash
pnpm dev
```
Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal).

### Building for Production

To create a production-ready build:
```bash
pnpm build
```
The build artifacts will be stored in the `dist/` directory.

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

## 📦 Deployment

### Deploy to Vercel
This project is optimized for Vercel.
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel deploy` in the project root.
3. Follow the prompts to ship your local-first finance tracker to the web.

Since the app is client-side only (local-first), it can be hosted on any static site provider like Vercel, Netlify, or GitHub Pages.

## 🛡️ Privacy Note
This application runs entirely in your browser. Clearing your browser cache or site data will remove your financial data unless you have exported a backup. Always keep backups of your important data.