import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { SessionContextProvider } from "./contexts/SessionContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProtectedRoute from "@/components/ProtectedRoute"; // Import ProtectedRoute

// Lazy load page components
const Index = lazy(() => import("@/pages/Index"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login")); // Import Login page

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SessionContextProvider>
        <TransactionsProvider>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<Login />} /> {/* Login route */}
                <Route element={<ProtectedRoute />}> {/* Protected routes */}
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Index />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} /> {/* Catch-all for non-existent routes */}
              </Routes>
            </Suspense>
          </Router>
        </TransactionsProvider>
      </SessionContextProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;