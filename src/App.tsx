import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { VendorsProvider } from "./contexts/VendorsContext"; // Import VendorsProvider
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy load page components
const Index = lazy(() => import("@/pages/Index"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const VendorsPage = lazy(() => import("@/pages/VendorsPage")); // Lazy load VendorsPage
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TransactionsProvider>
        <VendorsProvider> {/* Wrap with VendorsProvider */}
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="vendors" element={<VendorsPage />} /> {/* Add route for VendorsPage */}
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </VendorsProvider>
      </TransactionsProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;