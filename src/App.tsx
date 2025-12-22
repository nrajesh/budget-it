import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import IndexPage from './pages/Index';
import TransactionsPage from './pages/Transactions';
import ScheduledTransactionsPage from './pages/ScheduledTransactions';
import AccountsPage from './pages/Accounts';
import CategoriesPage from './pages/Categories';
import VendorsPage from './pages/Vendors';
import SettingsPage from './pages/SettingsPage';
import EssentialReports from './pages/reports/EssentialReports';
import AdvancedReports from './pages/reports/AdvancedReports';
import AnalyticsPage from './pages/Analytics'; // Added
import ProfilePage from './pages/ProfilePage'; // Added
import { UserProvider } from './contexts/UserContext';
import { TransactionsProvider } from './contexts/TransactionsContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TransactionsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<IndexPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="scheduled" element={<ScheduledTransactionsPage />} />
                <Route path="accounts" element={<AccountsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="vendors" element={<VendorsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="reports/essential" element={<EssentialReports />} />
                <Route path="reports/advanced" element={<AdvancedReports />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                {/* Add more routes here */}
              </Route>
            </Routes>
          </BrowserRouter>
        </TransactionsProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;