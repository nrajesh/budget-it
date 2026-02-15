# Migration Specs: Supabase to Local-First (Dexie.js)

## 1. Schema Definition
The following tables and relationships must be replicated in Dexie.js.

### Tables

#### `vendors` (Payees)
*   `id` (string, PK)
*   `name` (string, unique)
*   `is_account` (boolean)
*   `account_id` (string, nullable, FK to accounts)
*   `created_at` (string/date)

#### `accounts`
*   `id` (string, PK)
*   `currency` (string, default 'USD')
*   `starting_balance` (number, default 0)
*   `remarks` (string)
*   `created_at` (string/date)

#### `categories`
*   `id` (string, PK)
*   `user_id` (string) -> *Note: In local-first, user_id can be static or ignored if single-user.*
*   `name` (string)
*   `created_at` (string/date)

#### `sub_categories`
*   `id` (string, PK)
*   `user_id` (string)
*   `category_id` (string, FK to categories)
*   `name` (string)
*   `created_at` (string/date)

#### `budgets`
*   `id` (string, PK)
*   `user_id` (string)
*   `category_id` (string, FK to categories)
*   `category_name` (string)
*   `sub_category_id` (string, nullable, FK to sub_categories)
*   `sub_category_name` (string, nullable)
*   `target_amount` (number)
*   `spent_amount` (number) -> *Derived/Cached? Supabase calc'd this via RPC.*
*   `currency` (string)
*   `start_date` (string/date)
*   `end_date` (string/date, nullable)
*   `frequency` (enum: 'Monthly', 'Quarterly', 'Yearly', 'One-time')
*   `created_at` (string/date)

#### `transactions`
*   `id` (string, PK)
*   `user_id` (string)
*   `date` (string/date)
*   `amount` (number)
*   `currency` (string)
*   `account` (string) -> *Name of the account/vendor (redundant but used in UI)*
*   `vendor` (string) -> *Name of the payee/vendor*
*   `category` (string)
*   `sub_category` (string, nullable)
*   `remarks` (string, nullable)
*   `is_scheduled_origin` (boolean)
*   `transfer_id` (string, nullable) -> *Links two transactions for a transfer*
*   `recurrence_id` (string, nullable)
*   `recurrence_frequency` (string, nullable)
*   `recurrence_end_date` (string/date, nullable)
*   `created_at` (string/date)

## 2. Business Logic (RPCs & Utils)

### Critical Logic to Replicate

1.  **`ensurePayeeExists(name, isAccount)`**
    *   Checks if `vendors` contains `name`.
    *   If not, creates it.
    *   If `isAccount` is true, ensures an entry in `accounts` exists and links it.

2.  **`ensureCategoryExists(name)`**
    *   Checks if `categories` contains `name`.
    *   If not, creates it.

3.  **`ensureSubCategoryExists(name, categoryId)`**
    *   Checks if `sub_categories` contains `name` under `categoryId`.
    *   If not, creates it.

4.  **`checkIfPayeeIsAccount(name)`**
    *   Returns true if the vendor with `name` has `is_account = true`.

5.  **`getAccountCurrency(name)`**
    *   Finds vendor by name -> gets linked account -> returns currency.

6.  **`get_budgets_with_spending` (RPC Replacement)**
    *   Supabase used a Postgres function to join budgets with transactions and sum `amount` where `category` matches.
    *   **Local Implementation:**
        *   Fetch all budgets.
        *   For each budget, query `transactions` table.
        *   Filter transactions by:
            *   `category` (and `sub_category` if specified).
            *   `date` range (based on budget frequency and start date).
        *   Sum `amount` (negate if expense is negative) to calculate `spent_amount`.

7.  **`clear_all_app_data` (RPC Replacement)**
    *   **Local Implementation:** `db.delete()` or clearing all tables in a transaction.

8.  **Transaction Pairing (Transfers)**
    *   When adding a transfer, create TWO transactions (Debit & Credit) linked by `transfer_id`.
    *   When deleting, delete by `transfer_id` to remove both.
