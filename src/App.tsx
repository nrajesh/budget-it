"use client";

import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, Outlet, Navigate } from 'react-router-dom';
import { Layout, LayoutHeader, LayoutMain, LayoutFooter } from '@/components/layout';
import { Home, DollarSign, Calendar, Settings, Wallet, PiggyBank, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import Index from '@/pages/Index';
import Accounts from '@/pages/Accounts';
import Transactions from '@/pages/Transactions';
import ScheduledTransactions from '@/pages/ScheduledTransactions';
import Categories from '@/pages/Categories';
import Budgets from '@/pages/Budgets';
import Reports from '@/pages/Reports';
import SettingsPage from '@/pages/Settings';
import Login from '@/pages/Login';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import NotificationsBell from '@/components/NotificationsBell'; // Import the new component

const queryClient = new QueryClient();

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Accounts', path: '/accounts', icon: Wallet },
  { name: 'Transactions', path: '/transactions', icon: DollarSign },
  { name: 'Scheduled', path: '/scheduled-transactions', icon: Calendar },
  { name: 'Categories', path: '/categories', icon: PiggyBank },
  { name: 'Budgets', path: '/budgets', icon: BarChart3 },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();
  if (isLoading) {
    return <div>Loading authentication...</div>;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Index />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="scheduled-transactions" element={<ScheduledTransactions />} />
              <Route path="categories" element={<Categories />} />
              <Route path="budgets" element={<Budgets />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function AppLayout() {
  const { signOut } = useAuth();

  return (
    <TooltipProvider>
      <Layout>
        <LayoutHeader className="flex justify-between items-center p-4 border-b">
          <h1 className="text-xl font-bold">Budget App</h1>
          <div className="flex items-center space-x-4">
            <NotificationsBell /> {/* Add the NotificationsBell here */}
            <Button onClick={signOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </LayoutHeader>
        <div className="flex flex-1">
          <aside className="w-16 border-r p-2 flex flex-col items-center space-y-2">
            {navItems.map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Link to={item.path}>
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.name}</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.name}</TooltipContent>
              </Tooltip>
            ))}
          </aside>
          <LayoutMain className="flex-1 p-4">
            <Outlet />
          </LayoutMain>
        </div>
        <LayoutFooter className="p-4 border-t text-center text-sm text-gray-500">
          © 2024 Budget App
        </LayoutFooter>
      </Layout>
    </TooltipProvider>
  );
}

export default App;