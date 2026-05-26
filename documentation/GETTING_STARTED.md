# Getting Started

This page is for trying Vaulted Money without needing to understand the codebase.

## The Big Idea

Vaulted Money is like a notebook for your money, but searchable and visual. A ledger is one notebook. A transaction is one line in that notebook. Categories explain what the money was for. Budgets help you compare what you planned with what actually happened.

## Before You Start

Install these once on your computer:

| Tool | Why You Need It |
| --- | --- |
| Node.js 18+ | Runs the app development server. |
| pnpm 8+ | Installs the app's packages. |
| Git | Downloads the project. |

If you already have Node.js, install pnpm with:

```bash
npm install -g pnpm
```

## Run In A Browser

```bash
git clone https://github.com/nrajesh/vaulted.money.git
cd vaulted.money
pnpm install
pnpm dev
```

Open [http://localhost:8081](http://localhost:8081).

If the terminal shows a different local address, use the address shown there.

## Run As A Desktop App

```bash
pnpm run electron:dev
```

Use this instead of running `pnpm dev` separately. The desktop command already starts the local web server before opening Electron.

## Your First Five Minutes

1. Open Vaulted Money.
2. Create a ledger, such as `Personal`.
3. Choose your main currency.
4. Go to Transactions.
5. Add a transaction with a date, account, payee, category, and amount.
6. Add a few more transactions or import a CSV from your bank.
7. Visit Dashboard, Budgets, Analytics, and Reports to see what changed.
8. Export a backup before relying on the data long term.

## What To Remember

- Local-first means private, but it also means you must keep backups.
- Clearing browser site data can remove your ledger.
- Browser private/incognito windows are not a safe place to keep finance data.
- The desktop app is usually a better choice if you want a dedicated local app window.

## Common Fixes

If install fails:

```bash
rm -rf node_modules
pnpm install
```

If the browser cannot open the app, check the terminal for the actual Vite URL.

If Electron says the port is already in use, stop any old `pnpm dev` process and run:

```bash
pnpm run electron:dev
```
