# Budget Tracker App

This is a personal finance management application designed to help users track their income, expenses, and manage their budget effectively.

## Features

*   **User Authentication**: Secure sign-up and login using Supabase.
*   **Transaction Management**: Add, view, edit, and delete transactions.
*   **Account Management**: Create and manage different financial accounts.
*   **Category Management**: Organize transactions into custom categories.
*   **Vendor Management**: Track spending by vendors/payees.
*   **Scheduled Transactions**: Set up recurring transactions for better planning.
*   **Budgeting**: Create and monitor budgets for various categories.
*   **Analytics Dashboard**: Visualize spending habits and financial health with interactive charts.
    *   **Date Range Filtering**: Filter all analytics graphs and tables (Balance over Time, Spending by Category/Vendor, Recent Transactions) to a specific date range.
    *   **Filter Reset**: Easily reset all date, account, and category filters to their default states with a single button.
*   **Responsive Design**: Optimized for various screen sizes using Tailwind CSS and Shadcn/ui components.

## Tech Stack

*   **Frontend**: React, TypeScript
*   **Styling**: Tailwind CSS, Shadcn/ui
*   **Routing**: React Router
*   **Backend/Database/Auth**: Supabase
*   **Charting**: Recharts (via Shadcn/ui chart component)

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   A Supabase project (URL and Anon Key)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone [repository-url]
    cd budget-tracker-app
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up Supabase**:
    *   Create a new Supabase project.
    *   Update `src/integrations/supabase/client.ts` with your Supabase URL and Anon Key.
    *   Apply the necessary database schema and RLS policies (refer to the Supabase section in the project documentation or initial setup instructions).
    *   Ensure the `user_profile`, `categories`, `vendors`, `accounts`, `transactions`, `scheduled_transactions`, and `budgets` tables are set up with appropriate RLS.
    *   Set up the `handle_new_user` function and trigger for automatic profile creation on signup.
    *   Ensure `ensure_default_vendor` and `ensure_default_categories_for_user` functions are in place.

4.  **Run the development server**:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser to see the application.

## Project Structure

```
src/
├── components/           # Reusable UI components (e.g., Button, MultiSelectDropdown, DatePickerWithRange)
├── contexts/             # React Contexts for global state management (e.g., TransactionsContext)
├── integrations/         # Supabase client setup
├── lib/                  # Utility functions and configurations (e.g., utils.ts for slugify)
├── pages/                # Main application pages (e.g., Index.tsx, Analytics.tsx, Login.tsx)
├── App.tsx               # Main application component, handles routing
├── main.tsx              # Entry point for the React application
└── index.css             # Global styles
```

## Database Schema (Supabase)

The application uses the following tables in Supabase:

*   `user_profile`: Stores additional user information (first name, last name, avatar, default currency).
*   `categories`: User-defined transaction categories.
*   `vendors`: Payees or merchants for transactions.
*   `accounts`: Financial accounts (e.g., Checking, Savings, Credit Card).
*   `transactions`: Records of all financial transactions.
*   `scheduled_transactions`: Records for recurring transactions.
*   `budgets`: User-defined budgets for categories.

**Row Level Security (RLS)** is enabled and configured for all tables to ensure users can only access their own data where applicable.

## Contributing

Feel free to fork the repository, make changes, and submit pull requests.

## License

[Specify your license here, e.g., MIT License]