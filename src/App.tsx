"use client";

import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import Index from "./pages/Index";
import About from "./pages/About";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import AccountsPage from "./pages/Accounts";
import CategoriesPage from "./pages/Categories";
import VendorsPage from "./pages/Vendors";
import ScheduledTransactionsPage from "./pages/ScheduledTransactions";
import BudgetsPage from "./pages/Budgets";
import SettingsPage from "./pages/SettingsPage";
import ReportLayout from "./pages/reports/ReportLayout";
import EssentialReports from "./pages/reports/EssentialReports";
import AdvancedReports from "./pages/reports/AdvancedReports";

import { TransactionsProvider } from "./contexts/TransactionsContext";
import { CurrencyProvider } from "@/hooks/useCurrency"; // Ensure this path is correct and consistent

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <CurrencyProvider> {/* Wrap the entire application with CurrencyProvider */}
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="about" element={<About />} />
              <Route
                path="transactions"
                element={
                  <TransactionsProvider>
                    <Transactions />
                  </TransactionsProvider>
                }
              />
              <Route path="analytics" element={<Analytics />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="vendors" element={<VendorsPage />} />
              <Route path="scheduled-transactions" element={<ScheduledTransactionsPage />} />
              <Route path="budgets" element={<BudgetsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="reports" element={<ReportLayout />}>
                <Route index element={<EssentialReports />} />
                <Route path="essential" element={<EssentialReports />} />
                <Route path="advanced" element={<AdvancedReports />} />
              </Route>
            </Route>
          </Routes>
        </CurrencyProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;