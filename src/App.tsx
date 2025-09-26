import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Payees from "@/pages/Payees";
import Categories from "@/pages/Categories";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";
import Accounts from "@/pages/Accounts";
import Vendors from "@/pages/Vendors";
import EssentialsReport from "./pages/reports/EssentialsReport";
import SpendingAnalysisReport from "./pages/reports/SpendingAnalysisReport";
import NetWorthTrackerReport from "./pages/reports/NetWorthTrackerReport";
import CashFlowStatementReport from "./pages/reports/CashFlowStatementReport";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { UserProvider } from "./contexts/UserContext";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import ScheduledTransactionsPage from "./pages/ScheduledTransactions";

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <UserProvider>
          <CurrencyProvider>
            <TransactionsProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/transactions" element={<Transactions />} />
                          <Route path="/scheduled" element={<ScheduledTransactionsPage />} />
                          <Route path="/payees" element={<Payees />} />
                          <Route path="/accounts" element={<Accounts />} />
                          <Route path="/vendors" element={<Vendors />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/reports/essentials" element={<EssentialsReport />} />
                          <Route path="/reports/spending" element={<SpendingAnalysisReport />} />
                          <Route path="/reports/net-worth" element={<NetWorthTrackerReport />} />
                          <Route path="/reports/cash-flow" element={<CashFlowStatementReport />} />
                          <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <Toaster />
            </TransactionsProvider>
          </CurrencyProvider>
        </UserProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;