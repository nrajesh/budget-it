# User Guide

This page explains Vaulted Money as an app, not as a code project.

## Core Concepts

| Term | Meaning |
| --- | --- |
| Ledger | A separate money book, such as Personal, Business, or Joint. |
| Transaction | One money event: income, expense, or transfer. |
| Account | Where money lives, such as checking, savings, cash, or credit card. |
| Payee or vendor | Who the money went to or came from. |
| Category | What the money was for. |
| Budget | A limit, goal, or plan for a category over time. |
| Backup | A file copy of your local data. |

## Basic Flow

1. Create a ledger.
2. Add accounts.
3. Add transactions manually or import a CSV.
4. Categorize transactions.
5. Create budgets.
6. Review dashboard, analytics, reports, and trends.
7. Export backups regularly.

## Ledgers

Use ledgers when you want clean separation. For example:

- Personal spending
- Family or joint expenses
- Freelance or business finances
- A travel budget

Each ledger can have its own currency, accounts, transactions, budgets, and reports.

## Transactions

Transactions are the heart of the app. A useful transaction usually has:

- Date
- Account
- Payee or vendor
- Category
- Amount
- Optional remarks

Expenses are stored as negative amounts. Income is stored as positive amounts.

## CSV Import

Use CSV import when you already have bank history. The app lets you map CSV columns to fields like date, amount, account, vendor, category, and notes.

After importing, check a few rows manually so you trust the mapping before making decisions from the reports.

## Budgets And Reports

Budgets help you compare your plan with your actual spending. Reports help you answer questions like:

- How much did I spend this month?
- Which categories changed over time?
- What is my net worth?
- How much income came in?
- Are savings improving or shrinking?

## Optional AI Categorization

Vaulted Money can use a provider you configure to help categorize transactions. This is bring-your-own-key: you choose the provider and enter your own API key.

Supported provider types include Gemini, OpenAI, Anthropic, Mistral, Perplexity, and custom OpenAI-compatible endpoints.

API keys stay local and are not exported in backups. You must re-enter keys on a new device.

## Backups

Because Vaulted Money is local-first, backups matter.

Use backup exports before:

- Clearing browser data
- Switching devices
- Reinstalling the app
- Trying a major upgrade
- Importing a large CSV

Encrypted backups are recommended when the file may live in cloud storage or on a shared computer.

## Privacy Model

By default, Vaulted Money stores data locally in browser storage or the Electron app's local storage. There is no hosted Vaulted Money account and no central Vaulted Money server.

The main exception is optional AI categorization. If you configure and use it, relevant categorization data is sent to your selected AI provider.
