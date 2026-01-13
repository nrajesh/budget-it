import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { UserProvider } from "./contexts/UserContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProviderProvider } from "./context/DataProviderContext";

const queryClient = new QueryClient();

// Lazy load page components
const Index = lazy(() => import("@/pages/Index"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const Vendors = lazy(() => import("@/pages/Vendors"));
const Categories = lazy(() => import("@/pages/Categories"));
const ScheduledTransactions = lazy(() => import("@/pages/ScheduledTransactions"));
const Budgets = lazy(() => import("@/pages/Budgets"));
const EssentialReports = lazy(() => import("@/pages/reports/EssentialReports"));
const AdvancedReports = lazy(() => import("@/pages/reports/AdvancedReports"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProviderProvider>
      <ThemeProvider>
        <UserProvider>
          <TransactionsProvider>
            <Router>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Index />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/vendors" element={<Vendors />} />
                      <Route path="/accounts" element={<Accounts />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/scheduled" element={<ScheduledTransactions />} />
                      <Route path="/budgets" element={<Budgets />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/reports/essential" element={<EssentialReports />} />
                      <Route path="/reports/advanced" element={<AdvancedReports />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                </Routes>
              </Suspense>
            </Router>
          </TransactionsProvider>
        </UserProvider>
      </ThemeProvider>
      </DataProviderProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;