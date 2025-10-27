"use client";

import { BrowserRouter, Routes, Route, Link, Outlet, Navigate } from 'react-router-dom';
import { Layout, LayoutHeader, LayoutMain, LayoutFooter } from '@/components/Layout';
import { Home, DollarSign, Calendar, Settings, Wallet, PiggyBank, BarChart3 } from 'lucide-react';

import Index from '@/pages/Index';
import Transactions from '@/pages/Transactions';
import Accounts from '@/pages/Accounts';
import ScheduledTransactions from '@/pages/ScheduledTransactions';
import Categories from '@/pages/Categories';
import Budgets from '@/pages/Budgets';
import Reports from '@/pages/Reports';
import SettingsPage from '@/pages/Settings';
import Login from '@/pages/Login';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import NotificationsBell from '@/components/NotificationsBell';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import QueryClient and QueryClientProvider

const queryClient = new QueryClient(); // Create a new QueryClient instance

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <LayoutHeader>
                <nav className="flex items-center justify-between">
                  <Link to="/" className="text-xl font-bold">Budget-It</Link>
                  <div className="flex items-center space-x-4">
                    <Link to="/transactions" className="hover:underline flex items-center"><DollarSign className="mr-1" size={16} /> Transactions</Link>
                    <Link to="/accounts" className="hover:underline flex items-center"><Wallet className="mr-1" size={16} /> Accounts</Link>
                    <Link to="/scheduled" className="hover:underline flex items-center"><Calendar className="mr-1" size={16} /> Scheduled</Link>
                    <Link to="/categories" className="hover:underline flex items-center"><PiggyBank className="mr-1" size={16} /> Categories</Link>
                    <Link to="/budgets" className="hover:underline flex items-center"><BarChart3 className="mr-1" size={16} /> Budgets</Link>
                    <Link to="/reports" className="hover:underline flex items-center"><BarChart3 className="mr-1" size={16} /> Reports</Link>
                    <Link to="/settings" className="hover:underline flex items-center"><Settings className="mr-1" size={16} /> Settings</Link>
                    <NotificationsBell />
                  </div>
                </nav>
              </LayoutHeader>
              <LayoutMain>
                <Outlet />
              </LayoutMain>
              <LayoutFooter>
                © 2024 Budget-It. All rights reserved.
              </LayoutFooter>
            </Layout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Index />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="scheduled" element={<ScheduledTransactions />} />
        <Route path="categories" element={<Categories />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}> {/* Wrap with QueryClientProvider */}
          <AppRoutes />
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;