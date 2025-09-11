# My React Application

This is a React application built with TypeScript, React Router, Tailwind CSS, and Shadcn/ui components. It integrates with Supabase for backend services including authentication and database management.

## Features

### Authentication
*   User registration and login.
*   Session management.
*   User profiles with `first_name`, `last_name`, `avatar_url`, and `email`.
*   Automatic creation of default categories for new users.

### Transactions Management
*   View, add, edit, and delete financial transactions.
*   Categorize transactions.
*   Manage accounts and vendors.
*   Import and export transactions via CSV.

### Scheduled Transactions (New!)
*   **View and Manage**: Users can view, add, edit, and delete recurring scheduled transactions.
*   **Recurrence Options**: Define transactions with a specific start date, frequency (daily, weekly, monthly, yearly), and an optional end date.
*   **Date Restrictions**:
    *   **Start Date**: Must be tomorrow or any future date. Today's date is not selectable.
    *   **End Date**: Must be at least the selected Start Date, and also at least the day after tomorrow.
*   **Import/Export**: Easily import scheduled transactions from a CSV file or export existing ones.
*   **Automatic Processing**: Scheduled transactions with past due dates are automatically processed and added to your main transactions, with their `last_processed_date` updated to today.
*   **Dynamic Category**: The category for a scheduled transaction automatically defaults to 'Transfer' if the selected vendor is an account, and cannot be 'Transfer' otherwise.

## Getting Started

### Prerequisites
*   Node.js (LTS version recommended)
*   npm or yarn

### Installation
1.  Clone the repository:
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or yarn install
    ```
3.  Set up Supabase:
    *   Create a Supabase project.
    *   Update `src/integrations/supabase/client.ts` with your Supabase URL and Publishable Key.
    *   Apply the necessary SQL migrations for `user_profile`, `categories`, `vendors`, `accounts`, `transactions`, and `scheduled_transactions` tables, including RLS policies and the `handle_new_user` function. (These are typically handled by the Dyad AI editor during development).

### Running the Application
```bash
npm run dev
# or yarn dev
```
The application will be available at `http://localhost:3000`.

## Project Structure

*   `src/pages/`: Contains the main application pages.
*   `src/components/`: Reusable UI components.
*   `src/contexts/`: React Context API for global state management.
*   `src/integrations/supabase/`: Supabase client and utility functions.
*   `src/lib/`: Utility functions and helper modules.
*   `src/services/`: Business logic and data fetching services.
*   `src/utils/`: General utility functions (e.g., toast notifications).

## Technologies Used

*   **React**: Frontend library
*   **TypeScript**: Type-safe JavaScript
*   **React Router**: Declarative routing
*   **Tailwind CSS**: Utility-first CSS framework
*   **Shadcn/ui**: Reusable UI components built with Radix UI and Tailwind CSS
*   **Supabase**: Backend-as-a-Service (database, authentication, edge functions)
*   **React Hook Form**: Form management with validation
*   **Zod**: Schema validation
*   **React Query**: Data fetching, caching, and synchronization
*   **PapaParse**: CSV parsing and unparsing
*   **Lucide React**: Icon library