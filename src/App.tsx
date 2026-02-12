import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { UserProvider } from "./contexts/UserContext";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProviderProvider } from "./context/DataProviderContext";
import { FilterProvider } from "./contexts/FilterContext";

const queryClient = new QueryClient();

// Lazy load page components
const Index = lazy(() => import("@/pages/Index"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const Vendors = lazy(() => import("@/pages/Vendors"));
const Categories = lazy(() => import("@/pages/Categories"));
const ScheduledTransactions = lazy(
  () => import("@/pages/ScheduledTransactions"),
);
const Budgets = lazy(() => import("@/pages/Budgets"));
const EssentialReports = lazy(() => import("@/pages/reports/EssentialReports"));
const AdvancedReports = lazy(() => import("@/pages/reports/AdvancedReports"));
const Insights = lazy(() => import("@/pages/Insights"));
const LedgerEntryPage = lazy(() => import("@/pages/LedgerEntryPage"));
import { LedgerProvider } from "./contexts/LedgerContext";
const DataManagementPage = lazy(() => import("@/pages/DataManagementPage"));
const BackupPage = lazy(() => import("@/pages/BackupPage"));
const CurrenciesPage = lazy(() => import("@/pages/CurrenciesPage"));
import BackupManager from "@/components/backup/BackupManager";

// ... existing imports

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProviderProvider>
        <ThemeProvider>
          <FilterProvider>
            <LedgerProvider>
              <UserProvider>
                <TransactionsProvider>
                  <BackupManager />
                  <Router
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/ledgers" element={<LedgerEntryPage />} />
                        <Route path="/" element={<Layout />}>
                          <Route index element={<Index />} />
                          <Route
                            path="/transactions"
                            element={<Transactions />}
                          />
                          <Route path="/vendors" element={<Vendors />} />
                          <Route path="/accounts" element={<Accounts />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route
                            path="/scheduled"
                            element={<ScheduledTransactions />}
                          />
                          <Route path="/budgets" element={<Budgets />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route
                            path="/reports/essential"
                            element={<EssentialReports />}
                          />
                          <Route
                            path="/reports/advanced"
                            element={<AdvancedReports />}
                          />
                          <Route path="/insights" element={<Insights />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route
                            path="/data-management"
                            element={<DataManagementPage />}
                          />
                          <Route path="/backup" element={<BackupPage />} />
                          <Route path="/currencies" element={<CurrenciesPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Route>
                      </Routes>
                    </Suspense>
                  </Router>
                </TransactionsProvider>
              </UserProvider>
            </LedgerProvider>
          </FilterProvider>
        </ThemeProvider>
      </DataProviderProvider>
      <Toaster />
      <ShadcnToaster />
    </QueryClientProvider>
  );
}

export default App;
