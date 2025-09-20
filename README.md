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

### Scheduled Transactions
*   **View and Manage**: Users can view, add, edit, and delete recurring scheduled transactions.
*   **Recurrence Options**: Define transactions with a specific start date, frequency (e.g., every 2 weeks, every 1 month), and an optional end date.
*   **Automatic Processing**: Scheduled transactions are automatically processed and added to your main transaction list as their due dates pass.

### Entity Management
*   Dedicated pages to manage **Accounts**, **Vendors**, and **Categories**.
*   Full CRUD (Create, Read, Update, Delete) functionality for each entity.
*   Features include bulk deletion, CSV import/export, and quick inline editing.

### Reporting Module
The reporting module is split into two sections, both equipped with powerful filtering capabilities that allow you to drill down into your data by date range, search term, accounts, categories, and vendors.

#### Essential Reports
This section provides a clear overview of your current financial standing based on historical data.
*   **Net Worth Statement**: A snapshot of your financial health, summarizing total assets, liabilities, and your resulting net worth.
*   **Income & Expense Summary**: A detailed breakdown of your income and expenses, grouped by category.
*   **Trends and Analytics**: A visual bar chart that compares your monthly income versus expenses, helping you identify financial patterns over time.

#### Advanced Reports
This section leverages both historical and future scheduled transactions to provide insightful projections.
*   **Trend Forecasting**: A line chart that analyzes your historical net income to project future trends. It intelligently incorporates the impact of your scheduled transactions to offer a more accurate financial forecast.
*   **Financial Flow (Sankey Chart)**: A powerful visualization that shows how your money moves—from income sources, through your various accounts, and out to different expense categories.
*   **Alerts and Insights**: An automated analysis of your data that provides:
    *   **Low Balance Warnings**: Proactively alerts you if an account is projected to have a negative balance based on upcoming scheduled transactions.
    *   **Key Insights**: Highlights your top spending categories, most frequented vendors, and most active accounts.

### Settings
*   **Default Currency**: Set your preferred currency for all reports, summaries, and data displays.
*   **Future Projections**: Configure how many months into the future the Advanced Reports should project data from your scheduled transactions.
*   **Data Management**: Easily reset all application data or generate a comprehensive set of demo data to explore the app's features without using your own information.

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
*   `src/hooks/`: Custom hooks for reusable logic (e.g., transaction management).
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
*   **React Query**: For server state management, caching, and data fetching.
*   **React Hook Form & Zod**: For robust form handling and validation.
*   **PapaParse**: For CSV import/export functionality.
*   **Recharts**: For data visualization and charts.
*   **Lucide React**: Icon library