import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/Layout";
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
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
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
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="accounts" element={<Accounts />} />
                    <Route path="vendors" element={<Vendors />} />
                    <Route path="payees" element={<Payees />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="reports/essentials" element={<EssentialsReport />} />
                    <Route path="reports/spending-analysis" element={<SpendingAnalysisReport />} />
                    <Route path="reports/net-worth" element={<NetWorthTrackerReport />} />
                    <Route path="reports/cash-flow" element={<CashFlowStatementReport />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Routes>
                <Toaster />
              </TransactionsProvider>
            </CurrencyProvider>
          </UserProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;