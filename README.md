# Budget It! - Personal Finance Tracker

Budget It! is a modern, full-featured personal finance application built with React, TypeScript, and Supabase. It provides a comprehensive suite of tools for tracking transactions, managing accounts, setting budgets, scheduling recurring payments, and generating insightful financial reports.

## Features

### Core Functionality
*   **Dashboard**: An at-a-glance overview of your total balance, income vs. expenses, spending by category, recent financial activity, and overall budget health.
*   **Authentication**: Secure user registration and login powered by Supabase Auth. User profiles include personal details and avatars.
*   **Multi-Currency Support**: Set a default currency for reporting, with automatic conversion for transactions in different currencies.

### Transactions Management
*   **Full CRUD**: Easily view, add, edit, and delete financial transactions.
*   **Transfers**: Seamlessly handle transfers between accounts, including those with different currencies.
*   **Filtering & Search**: Powerful filtering by date range, accounts, categories, vendors, and a text search for remarks.
*   **Bulk Operations**: Delete multiple transactions at once.
*   **CSV Import/Export**: Easily import historical data or export your records.

### Scheduled Transactions
*   **Recurring Payments**: Define transactions with a specific start date, flexible frequency (e.g., every 2 weeks, every 1 month), and an optional end date.
*   **Automatic Processing**: Scheduled transactions are automatically processed and added to your main transaction list as their due dates pass, ensuring your records are always up-to-date.
*   **Future Visibility**: View upcoming scheduled transactions directly in the main transaction list, clearly marked and greyed out.

### Budgets Management
*   **Set Spending Targets**: Create budgets for specific categories with a target amount, currency, and frequency (e.g., monthly, weekly).
*   **Track Progress**: Monitor your spending against your budget targets in real-time.
*   **Flexible Periods**: Define start and end dates for your budgets, or let them run indefinitely.
*   **Active/Inactive Status**: Easily pause and resume budgets as your financial goals change.

### Entity Management
Dedicated pages to manage your financial entities with full CRUD, bulk deletion, and CSV import/export.
*   **Accounts**: Manage your bank accounts, credit cards, and investment funds. Each account has a starting balance and currency.
*   **Vendors**: Keep a list of payees you transact with, such as stores, utility companies, or individuals.
*   **Categories**: Organize your spending and income with customizable categories.

### Reporting Module
The reporting module is split into two sections, both equipped with powerful filtering capabilities and PDF export for tabular data.

#### Essential Reports
This section provides a clear overview of your current financial standing based on historical data.
*   **Net Worth Statement**: A snapshot of your financial health, summarizing total assets, liabilities, and your resulting net worth.
*   **Income & Expense Summary**: A detailed breakdown of your income and expenses by category, including variance against your budget targets.
*   **Trends and Analytics**: A visual bar chart that compares your monthly income versus expenses, with an overlay for your total budget target.

#### Advanced Reports
This section leverages both historical and future scheduled transactions to provide insightful projections.
*   **Trend Forecasting**: A line chart that analyzes your historical net income to project future trends, intelligently incorporating the impact of your scheduled transactions.
*   **Financial Flow (Sankey Chart)**: A powerful visualization that shows how your money moves—from income sources, through your various accounts, and out to different expense categories.
*   **Alerts and Insights**: An automated analysis that provides low balance warnings based on upcoming scheduled transactions, highlights budget overrun risks, and shows your top spending categories, vendors, and active accounts.

### Settings
*   **Default Currency**: Set your preferred currency for all reports and summaries.
*   **Future Projections**: Configure how many months into the future the Advanced Reports should project data.
*   **Data Management**: Easily reset all application data or generate a comprehensive set of demo data to explore the app's features.

## Database Schema

The application uses a PostgreSQL database managed by Supabase. All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

### `user_profile`
Stores public user information linked to the `auth.users` table.

| Column             | Type                     | Description                               |
| ------------------ | ------------------------ | ----------------------------------------- |
| `id` (PK)          | `uuid`                   | References `auth.users.id`                |
| `first_name`       | `text`                   | User's first name.                        |
| `last_name`        | `text`                   | User's last name.                         |
| `avatar_url`       | `text`                   | URL for the user's avatar image.          |
| `email`            | `text`                   | User's email address.                     |
| `default_currency` | `text`                   | The user's preferred currency code (e.g., 'USD'). |
| `updated_at`       | `timestamp with time zone` | Last update timestamp.                    |

### `accounts`
Stores details for user-created accounts (e.g., bank accounts, credit cards). Linked to the `vendors` table.

| Column             | Type                     | Description                               |
| ------------------ | ------------------------ | ----------------------------------------- |
| `id` (PK)          | `uuid`                   | Unique identifier for the account.        |
| `currency`         | `text`                   | Currency code (e.g., 'EUR', 'USD').       |
| `starting_balance` | `numeric`                | The initial balance of the account.       |
| `remarks`          | `text`                   | Optional notes about the account.         |
| `created_at`       | `timestamp with time zone` | Creation timestamp.                       |

### `vendors`
A unified table for both payees (vendors) and accounts to simplify transaction relationships.

| Column         | Type                     | Description                               |
| -------------- | ------------------------ | ----------------------------------------- |
| `id` (PK)      | `uuid`                   | Unique identifier for the vendor/account. |
| `name`         | `text`                   | The name of the vendor or account.        |
| `is_account`   | `boolean`                | `true` if this entity is an account.      |
| `account_id` (FK) | `uuid`                | References `accounts.id` if `is_account` is true. |
| `created_at`   | `timestamp with time zone` | Creation timestamp.                       |

### `categories`
Stores user-defined categories for transactions.

| Column      | Type                     | Description                               |
| ----------- | ------------------------ | ----------------------------------------- |
| `id` (PK)   | `uuid`                   | Unique identifier for the category.       |
| `user_id` (FK) | `uuid`                | References `auth.users.id`.               |
| `name`      | `text`                   | The name of the category (e.g., 'Groceries'). |
| `created_at`| `timestamp with time zone` | Creation timestamp.                       |

### `budgets`
Stores user-defined budgets for specific categories.

| Column          | Type                       | Description                               |
| --------------- | -------------------------- | ----------------------------------------- |
| `id` (PK)       | `uuid`                     | Unique identifier for the budget.         |
| `user_id` (FK)  | `uuid`                     | References `auth.users.id`.               |
| `category_id` (FK) | `uuid`                  | References `categories.id`.               |
| `target_amount` | `numeric`                  | The spending limit for the period.        |
| `currency`      | `text`                     | The currency of the target amount.        |
| `start_date`    | `timestamp with time zone` | The date the budget becomes active.       |
| `frequency`     | `text`                     | The recurrence pattern (e.g., '1m', '2w'). |
| `end_date`      | `timestamp with time zone` | Optional date the budget stops.           |
| `is_active`     | `boolean`                  | Whether the budget is currently active.   |
| `created_at`    | `timestamp with time zone` | Creation timestamp.                       |

### `transactions`
The core table for all financial transactions, including those generated from scheduled transactions.

| Column                 | Type                     | Description                               |
| ---------------------- | ------------------------ | ----------------------------------------- |
| `id` (PK)              | `uuid`                   | Unique identifier for the transaction.    |
| `user_id` (FK)         | `uuid`                   | References `auth.users.id`.               |
| `date`                 | `timestamp with time zone` | The date the transaction occurred.        |
| `account`              | `text`                   | The source account name.                  |
| `vendor`               | `text`                   | The vendor or destination account name.   |
| `category`             | `text`                   | The transaction category.                 |
| `amount`               | `numeric`                | The transaction amount (negative for expenses). |
| `currency`             | `text`                   | The currency of the transaction amount.   |
| `remarks`              | `text`                   | Optional notes.                           |
| `transfer_id`          | `text`                   | A shared ID for both legs of a transfer.  |
| `is_scheduled_origin`  | `boolean`                | `true` if generated from a scheduled transaction. |
| `recurrence_id`        | `uuid`                   | A shared ID for all transactions in a recurring series. |
| `recurrence_frequency` | `text`                   | The recurrence pattern (e.g., '1m' for monthly). |
| `recurrence_end_date`  | `timestamp with time zone` | The date the recurrence stops.            |
| `created_at`           | `timestamp with time zone` | Creation timestamp.                       |

### `scheduled_transactions`
Stores the definitions for recurring transactions.

| Column                | Type                     | Description                               |
| --------------------- | ------------------------ | ----------------------------------------- |
| `id` (PK)             | `uuid`                   | Unique identifier for the scheduled rule. |
| `user_id` (FK)        | `uuid`                   | References `auth.users.id`.               |
| `date`                | `timestamp with time zone` | The start date of the recurrence.         |
| `account`             | `text`                   | The source account name.                  |
| `vendor`              | `text`                   | The vendor or destination account name.   |
| `category`            | `text`                   | The transaction category.                 |
| `amount`              | `numeric`                | The transaction amount.                   |
| `frequency`           | `text`                   | The recurrence pattern (e.g., '1m', '2w'). |
| `remarks`             | `text`                   | Optional notes.                           |
| `last_processed_date` | `timestamp with time zone` | The date of the last generated transaction. |
| `recurrence_end_date` | `timestamp with time zone` | The date the recurrence stops.            |
| `created_at`          | `timestamp with time zone` | Creation timestamp.                       |

## Getting Started

### Prerequisites
*   Node.js (LTS version recommended)
*   pnpm (or npm/yarn)

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Set up Supabase:
    *   Create a Supabase project.
    *   Create a `.env` file in the root directory and add your Supabase URL and Publishable Key:
        ```
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
    *   Run the SQL scripts provided by the development team to set up the database schema, RLS policies, and required functions.

### Running the Application
```bash
pnpm dev
```
The application will be available at `http://localhost:8080`.

## Project Structure

*   `src/pages/`: Contains the main application pages.
*   `src/components/`: Reusable UI components.
*   `src/contexts/`: React Context for global state management.
*   `src/hooks/`: Custom hooks for reusable logic.
*   `src/integrations/supabase/`: Supabase client and utility functions.
*   `src/lib/`: General utility functions (e.g., date formatting).
*   `src/services/`: Business logic and data fetching services.

## Technologies Used

*   **React**: Frontend library
*   **TypeScript**: Type-safe JavaScript
*   **React Router**: Declarative routing
*   **Tailwind CSS**: Utility-first CSS framework
*   **Shadcn/ui**: Reusable UI components
*   **Supabase**: Backend-as-a-Service (Database, Auth)
*   **TanStack Query (React Query)**: Server state management and data fetching.
*   **React Hook Form & Zod**: Form handling and validation.
*   **PapaParse**: CSV import/export.
*   **Recharts**: Data visualization and charts.
*   **jsPDF & jspdf-autotable**: PDF export functionality.