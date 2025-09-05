import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import LoadingSpinner from "@/components/LoadingSpinner"; // Import the new LoadingSpinner

// Lazy load page components
const Index = lazy(() => import("@/pages/Index"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TransactionsProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}> {/* Add Suspense for lazy loading */}
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </TransactionsProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;