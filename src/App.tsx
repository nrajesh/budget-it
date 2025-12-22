import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/context/SessionContext";
import { TransactionsProvider } from "@/contexts/TransactionsContext";
import Layout from "@/components/layout/Layout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Lazy load pages
const IndexPage = lazy(() => import('@/pages/Index'));
const AccountsPage = lazy(() => import('@/pages/Accounts'));
const VendorsPage = lazy(() => import('@/pages/Vendors'));
const CategoriesPage = lazy(() => import('@/pages/Categories'));
const TransactionsPage = lazy(() => import('@/pages/Transactions'));
const ScheduledTransactionsPage = lazy(() => import('@/pages/ScheduledTransactions'));
const BudgetsPage = lazy(() => import('@/pages/Budgets'));
const ReportsPage = lazy(() => import('@/pages/Reports'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const LoginPage = lazy(() => import('@/pages/Login'));
const ProfilePage = lazy(() => import('@/pages/Profile'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TransactionsProvider>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<IndexPage />} />
                  <Route path="accounts" element={<AccountsPage />} />
                  <Route path="vendors" element={<VendorsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="scheduled-transactions" element={<ScheduledTransactionsPage />} />
                  <Route path="budgets" element={<BudgetsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
                <Route path="login" element={<LoginPage />} />
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
          <ReactQueryDevtools initialIsOpen={false} />
        </TransactionsProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

export default App;