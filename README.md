<h1 align="center">💰 Vaulted Money - Secure Finance Tracker</h1>

<p align="center">
  <i>A privacy-focused, local-first Secure Finance app. Track spending, manage budgets, and gain insights - without sending your data to the cloud.</i>
</p>

<!-- ─── Dynamic Status Badges ─────────────────────────────────── -->
<p align="center">
  <a href="https://app.circleci.com/pipelines/github/nrajesh/vaulted.money">
    <img src="https://img.shields.io/circleci/build/github/nrajesh/vaulted.money/main?logo=circleci&style=for-the-badge&token=CCIPRJ_Vr8m8ZBprdRweVA3p3Zuf1_ec111876745b6b9fe207e3e3bbbfbbf28de994d9" alt="CircleCI Build">
  </a>
  <a href="https://github.com/nrajesh/vaulted.money">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT">
  </a>
</p>

<!-- ─── Tech Stack Badges ─────────────────────────────────────── -->
<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white" alt="Google Gemini">
</p>

---

**Motivation:** Vaulted Money exists because basic budgeting should not sit behind paywalls when the core idea is simple math and honest records - and because your data should stay yours. For the full story, local-first ethos, and visuals, see **[Why Vaulted Money exists](documentation/WHY_VAULTED_MONEY.md)**.

---

## 🌟 Key Features

| Category                | Feature                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| 🔒 **Privacy**          | 100% local - data lives in your browser's IndexedDB. No cloud, no servers.                        |
| 📚 **Multi-Ledger**     | Separate ledgers for Personal, Business, Joint finances.                                          |
| 💳 **Transactions**     | Track with categories, sub-categories, vendors, and account groups.                               |
| 📊 **Budgets**          | Monthly, quarterly, yearly, or one-time budgets with progress tracking.                           |
| 🔁 **Scheduled**        | Recurring transactions with smart deduplication on import.                                        |
| 📈 **Analytics**        | Visual breakdowns of income, expenses, and savings trends.                                        |
| 🫀 **Financial Pulse**  | Premium dashboard for high-level financial health monitoring.                                     |
| 💬 **Smart Search**     | Natural language filtering for transactions, categories, and dates.                               |
| 🤖 **Optional AI**      | BYOK (Bring Your Own Key) for auto-categorizing transactions using OpenAI, Gemini, Anthropic, Mistral, Perplexity, or Custom endpoints. |
| 💾 **Backup & Restore** | Encrypted or plain JSON backups - import instantly without page reloads.                          |
| ⏰ **Auto-Backup**      | Scheduled backups via File System Access API (web) or direct filesystem (Electron).               |

---

## 🏗️ System Architecture

For a detailed view of the system architecture, including web and desktop component diagrams, data flow sequences, and technical decisions, please refer to the [**Architecture Documentation**](documentation/ARCHITECTURE.md).

---

## 🏠 Public Homepage (`/`)

The root route (`/`) is a public landing page that runs without an active ledger. It covers the privacy-first / local-first / open-source positioning, a ledger workspace preview, backup and CSV-import guidance, and copy-paste install commands. The authenticated app lives under `/ledgers`.

> The homepage is implemented in `src/pages/HomePage.tsx` and is kept outside the authenticated `Layout` route so it never triggers the active-ledger redirect.

---

## 🚀 Getting Started

### Prerequisites

> [!IMPORTANT]
> Before you begin, make sure you have the following installed:

| Requirement | Version | How to Install                                          |
| ----------- | ------- | ------------------------------------------------------- |
| **Node.js** | v18+    | [Download](https://nodejs.org/) or use `nvm install 18` |
| **pnpm**    | v8+     | `npm install -g pnpm`                                   |
| **Git**     | Any     | [Download](https://git-scm.com/)                        |

> [!NOTE]
> **pnpm** is strongly recommended. The project uses `pnpm-lock.yaml`, and all scripts are configured for it.

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/nrajesh/vaulted.money.git
cd vaulted.money

# 2. Install dependencies
pnpm install

# 3. Verify the setup (optional but recommended)
pnpm lint && pnpm build
```

> [!TIP]
> If `pnpm install` fails, try deleting `node_modules` and running `pnpm install` again:
>
> ```bash
> rm -rf node_modules && pnpm install
> ```

---

### 🌐 Running the Web App

```bash
pnpm dev
```

Open **http://localhost:8081** in your browser or the port defined in vite.config.ts. That's it!

---

### 🖥️ Running the Electron Desktop App

```bash
pnpm run electron:dev
```

This single command does everything:

1. Starts the Vite dev server on port `8081`
2. Waits for the server to be ready (`wait-on`)
3. Compiles Electron main & preload TypeScript
4. Launches the Electron window

> [!WARNING]
> **Do NOT run `pnpm dev` separately before `electron:dev`.**
> The `electron:dev` script already starts Vite internally using `concurrently`. Running them separately will cause a port conflict on `8081`.

> [!NOTE]
> **First-time Electron run** may take longer as it compiles TypeScript files and downloads the Electron binary (~100 MB).

---

### 📱 Mobile Support

| Platform          | Supported? | How                                         |
| ----------------- | ---------- | ------------------------------------------- |
| **macOS**         | ✅         | Electron desktop app or browser             |
| **Windows**       | ✅         | Electron desktop app or browser             |
| **Linux**         | ✅         | Electron desktop app or browser             |
| **iOS / Android** | ✅ Native  | Run natively via Capacitor (`npx cap sync`) |

> Electron cannot run on mobile devices. For mobile access, either host the web version or build the native apps using the provided Capactior iOS/Android targets for local continuity features.

---

### 🔨 Building for Production

| Target                  | Command                   | Output                          |
| ----------------------- | ------------------------- | ------------------------------- |
| Web                     | `pnpm build`              | `dist/`                         |
| Desktop (all platforms) | `pnpm run electron:build` | `release/` (DMG, EXE, AppImage) |

---

## 🔗 Live Demo

Deploy a production build to your host (for example [Cloudflare Pages](https://pages.cloudflare.com/)) and use that URL as the public demo.

---

## 📂 Project Structure

```
vaulted.money/
├── electron/                  # Electron-specific code
│   ├── main.ts                #   Main process (window, IPC, fs access)
│   └── preload.ts             #   Preload script (contextBridge)
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── ui/                #   Shadcn primitives (Button, Dialog, etc.)
│   │   ├── budgets/           #   Budget management
│   │   ├── charts/            #   Visualizations
│   │   ├── dashboard/         #   Home dashboard widgets
│   │   ├── dialogs/           #   Modals and popups
│   │   ├── filters/           #   Search & filtering logic
│   │   └── transactions/      #   Transaction tables & logic
│   ├── contexts/              # React Context Definitions
│   ├── providers/             # Context Providers (Data, Theme, etc.)
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Route-level page components
│   │   ├── HomePage.tsx       #   Public landing page (route: /)
│   │   └── ...                #   Authenticated app pages
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Helper functions (currency, date, etc.)
│   └── tests/                 # Test files
├── .agent/workflows/          # AI agent slash command definitions
├── scheduled-agents/          # AI agent rulesets (personality & rules)
├── specs/                     # Feature specifications (Speckit artifacts)
├── .circleci/                 # CircleCI Pipeline config
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## ✅ Quality Assurance

We enforce high code quality standards using a strict **CircleCI** pipeline. Every pull request must pass the following checks before merging:

| Check          | Command              | Description                                             |
| -------------- | -------------------- | ------------------------------------------------------- |
| **Linting**    | `pnpm lint`          | ESLint checks for code quality and best practices.      |
| **Type Safe**  | `tsc --noEmit`       | Full TypeScript strict mode check.                      |
| **Formatting** | `pnpm format:check`  | Prettier verification to ensure consistent style.       |
| **Testing**    | `pnpm test:coverage` | Vitest unit tests with coverage reporting.              |
| **Security**   | `pnpm audit`         | Checks dependencies for known vulnerabilities.          |
| **Build**      | `pnpm build`         | Verifies that the production bundle compiles correctly. |

> [!TIP]
> You can run `pnpm validate` locally to run TypeScript and ESLint checks in one go.

> [!NOTE]
> **Security Overrides**: `package.json` includes a handful of `pnpm.overrides` that pin transitive dependencies (`tar`, `undici`, `flatted`, `yauzl`, `dompurify`, `@tootallnate/once`, `picomatch`) to patched versions. These resolve Dependabot alerts for packages we don't import directly - they're pulled in by tooling like Vitest, ESLint, Capacitor CLI, and Electron. Run `pnpm audit` to verify.

---

## 📚 Documentation & Workflow

### 1. Interpreting the Documentation Folder

The `documentation/` folder serves as the "Constitution" and "Operating System" for the project.

| File                                                                         | Purpose                                                                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **[`DESIGN.md`](documentation/DESIGN.md)**                                   | **Brand Identity Manual**. Philosophy, logo geometry, and color strategies for light/dark modes.                     |
| **[`WHY_VAULTED_MONEY.md`](documentation/WHY_VAULTED_MONEY.md)**                     | **Why this project**. Motivation, privacy stance, hopes for forks/localization, and story infographics.              |
| **[`SPEC_DRIVEN_DEVELOPMENT.md`](documentation/SPEC_DRIVEN_DEVELOPMENT.md)** | **The Workflow Guide**. Comprehensive guide on how to build features using the Spec-Driven Development methodology. |
| **[`AGENTS.md`](documentation/AGENTS.md)**                                   | **The Rulebook**. Technical constraints and boundaries for the AI agent (e.g., "Privacy First", "Use Tailwind").    |
| **[`SUPPORT.md`](documentation/SUPPORT.md)**                                 | **Support Policy**. How to get help and file issues.                                                                |
| **[`SECURITY.md`](documentation/SECURITY.md)**                               | **Security Policy**. Reporting vulnerabilities and privacy details.                                                 |

### 2. How to Work with Speckit

> **Note**: For a deep dive into the workflow, read the [**Spec-Driven Development Guide**](documentation/SPEC_DRIVEN_DEVELOPMENT.md).

#### Quick Start

1.  **Specify**: `/speckit.specify "Build a new feature"`
2.  **Plan**: `/speckit.plan`
3.  **Task**: `/speckit.tasks`
4.  **Implement**: `/speckit.implement`

### 3. AI Agent Workflows

This project includes three specialized AI agents that can be invoked via slash commands in a compatible AI-powered IDE. Each agent focuses on a specific area of code quality and runs a self-contained workflow: it scans the codebase, identifies improvements, implements changes, and verifies them - all from a single command.

| Command           | Agent       | What It Does                                                                                                                             |
| ----------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/agent.palette`  | 🎨 Palette  | Finds and fixes **UX and accessibility** issues - missing ARIA labels, poor color contrast, keyboard navigation gaps, and visual polish. |
| `/agent.bolt`     | ⚡ Bolt     | Finds and fixes **performance** issues - unnecessary re-renders, missing memoization, bundle size optimizations, and slow queries.       |
| `/agent.sentinel` | 🛡️ Sentinel | Finds and fixes **security** issues - XSS vulnerabilities, unsafe data handling, missing input validation, and dependency risks.         |

#### How do they work?

Each agent has two parts:

1. **Ruleset** (`scheduled-agents/*.md`) - A detailed personality and checklist that tells the agent what to look for and how to behave. Think of it as the agent's "mission brief".
2. **Workflow** (`.agent/workflows/agent.*.md`) - The step-by-step process the agent follows: create a branch → scan the codebase → implement fixes → run all quality checks → merge.

#### Do I need a specific IDE?

The slash commands (e.g., `/agent.palette`) work automatically in IDEs that support the `.agent/workflows/` convention. Even if your IDE doesn't support slash commands, the ruleset files in `scheduled-agents/` are plain markdown - you can read them and follow the instructions manually, or paste them as context for any AI assistant.

---

## 🛠️ Development Guide

### AI Provider Configuration

Vaulted Money supports "Bring Your Own Key" (BYOK) AI categorization. You can manage AI providers directly in the application.

1.  **AI Provider Management**: Navigate to **Management > AI Providers** in the sidebar.
2.  **Add/Edit Provider**:
    *   Click **Add AI Provider** to add a new endpoint.
    *   Set the **Name**, **Model ID**, and **Base URL**.
    *   **Provider Type**: Choose Gemini, OpenAI, Anthropic, Mistral, Perplexity, or Custom (OpenAI compatible).
3.  **Configure API Key**: Go to **Settings**, select your new provider as the default, and enter your API key. Keys are stored safely and locally in your browser's IndexedDB.
4.  **Local LLMs**: Add a provider with Type `Custom` and Base URL `http://localhost:11434/v1` (for Ollama) to use local models securely without any internet access required.

> [!NOTE]
> AI providers are stored in the database and included in exports, but **API keys are never exported** for security reasons. You must re-enter keys on new devices.

### ⚠️ Important: Content Security Policy (CSP)

Because Vaulted Money is a strict local-first application, its Content Security Policy (CSP) blocks outgoing network requests by default. 

**If you add a completely new API domain via the UI (e.g. `https://api.my-new-ai.com`), you MUST add it to the allowed domains list in the code.**

1. Open `vite.config.ts`.
2. Add your new domain to the `aiDomains` array:

```typescript
// vite.config.ts
const aiDomains = [
  "https://generativelanguage.googleapis.com",
  "https://api.openai.com",
  "https://api.anthropic.com",
  "https://api.mistral.ai",
  "https://api.perplexity.ai",
  // Add your new domain here:
  "https://api.your-custom-ai-provider.com",
];
```

3. Restart the development server (`pnpm dev`) or rebuild the app.

> [!TIP]
> You rarely need to write new code to support a new AI provider! Simply select `Custom` as the Provider Type in the UI. Our robust JSON parser handles OpenAI-compatible JSON responses automatically. You only need to edit `useAutoCategorize.ts` if the new provider has a completely unique request structure (like Anthropic).


### Adding New Components

1. `src/components/ui/` - Generic, reusable UI primitives
2. `src/components/<feature>/` - Feature-specific components
3. `src/components/layout/` - Layout wrappers

**Guidelines:**

- Use **functional components** with TypeScript interfaces
- Style with **Tailwind CSS** utility classes
- Ensure **responsive design** (mobile-first)
- Add JSDoc comments for complex logic

### State Management

- `useTransactions()` - global financial data
- `useState` - UI-only state (dialog open/close)
- `useQuery` - async data fetching with TanStack Query

### Testing

```bash
pnpm test              # Run unit tests (Vitest)
pnpm test:coverage     # Run with coverage report
pnpm lint              # Run ESLint checks
pnpm validate          # TypeScript + ESLint in one shot
```

---

## 📦 Deployment

The web build is a static SPA (`dist/`). Use any static host; **Cloudflare Pages** is a good fit: connect the Git repository, set the build command to `pnpm run build`, the build output directory to `dist`, and use Node 20+ to match local builds. The `public/_redirects` file is included for client-side routing on Cloudflare Pages.

You can also deploy the `dist` folder with `npx wrangler pages deploy dist` (Wrangler from devDependencies or `npx`) after `pnpm run build`, if you are not using Git-integrated builds.

---

## 🛡️ Privacy Note

> This application runs entirely in your browser (or local Electron instance). **No data is ever sent to a server** unless you explicitly configure and trigger the completely optional AI auto-categorization feature using your own API key. Clearing your browser cache or site data will remove your financial data unless you have exported a backup. Always keep backups of your important data.

---

<p align="center">
  Made with ❤️ for your financial freedom
</p>
