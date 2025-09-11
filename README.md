# Welcome to your Dyad app

This application provides a comprehensive financial analytics dashboard, allowing users to track income, expenses, and balances with detailed insights. It is powered by **Supabase** for data persistence and authentication.

## Key Features:

*   **User Authentication & Profile Management**: Secure user login, profile editing (first name, last name, email), password change functionality, and avatar upload.
*   **Supabase Integration**: All transaction, account, and vendor data is stored and managed in a Supabase database, ensuring data persistence and scalability.
*   **Financial Overview**: Displays total income, total expenses, net balance, and total transaction count on the Dashboard, along with monthly percentage changes.
*   **Account Filtering**: Filter all metrics, charts, and transactions by specific accounts.
*   **Category Filtering**: Filter transactions by specific categories.
*   **Date Range Filtering**: Filter transactions by a custom date range on the Transactions page.
*   **Balance Over Time Chart**: Visualizes the cumulative balance of selected accounts over time.
*   **Spending Categories Chart**: Breaks down expenses by category, showing where your money goes.
*   **Spending by Vendor Chart**: Visualizes expenses by individual vendors, highlighting top spending areas.
*   **Recent Transactions Table**: A paginated table displaying recent transactions with a running balance, filtered by selected accounts and categories.
*   **Transaction Management**:
    *   Add, edit, and delete individual transactions.
    *   Handle transfers between accounts, including cross-currency conversions with editable receiving amounts.
    *   CSV Import/Export: Easily import new transactions from a CSV file or export existing transactions.
    *   Bulk Delete: Delete multiple selected transactions at once.
    *   **Enhanced Filtering**: All transaction filters (search text, account, category, vendor, and date range dropdowns) are now fully functional and responsive, allowing for precise data analysis. The "All" option in multi-select dropdowns correctly toggles selections.
*   **Scheduled Transactions**: Define recurring transactions with custom frequencies (daily, weekly, monthly, yearly). The system automatically processes and adds these transactions to your records on their due dates, with options to view upcoming occurrences.
*   **Payee Management (Vendors & Accounts)**:
    *   Dedicated pages for managing Vendors and Accounts.
        *   Add, edit, and delete individual vendors and accounts.
    *   Inline editing for vendor names.
    *   CSV Import/Export: Import new vendors/accounts from CSV or export existing ones.
    *   Bulk Delete: Delete multiple selected vendors or accounts.
*   **Transfer Exclusion**: All financial metrics and charts correctly exclude 'Transfer' transactions for accurate reporting.
*   **Currency Selection**: Users can select their preferred display currency, with all financial figures converting dynamically based on mock exchange rates.
*   **Data Management**: Options to reset all transaction data or generate a large set of diverse demo data (over 1000 transactions) with a progress indicator.
*   **Responsive Design**: Optimized for seamless viewing and interaction across mobile, tablet, and desktop displays.
*   **Optimized Page Load**: Utilizes lazy loading for page components to improve initial loading performance.
*   **Loading Overlays**: Provides visual feedback during data-intensive operations like imports, exports, and data generation.