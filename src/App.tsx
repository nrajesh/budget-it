import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { UserProvider } from "./contexts/UserContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Lazy load page components
const Index = lazy(() => import("@/pages/Index"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const Vendors = lazy(() => import("@/pages/Vendors"));
const Categories = lazy(() => import("@/pages/Categories"));
const ScheduledTransactions = lazy(() => import("@/pages/ScheduledTransactions"));
const EssentialReports = lazy(() => import("@/pages/reports/EssentialReports"));
const AdvancedReports = lazy(() => import("@/pages/reports/AdvancedReports"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <CurrencyProvider>
          <TransactionsProvider>
            <Router>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  {/* Protected routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Index />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/vendors" element={<Vendors />} />
                      <Route path="/accounts" element={<Accounts />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/scheduled" element={<ScheduledTransactions />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/reports/essential" element={<EssentialReports />} />
                      <Route path="/reports/advanced" element={<AdvancedReports />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </Router>
          </TransactionsProvider>
        </CurrencyProvider>
      </UserProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;