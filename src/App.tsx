import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { UserProvider } from "./contexts/UserContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy load page components
const Index = lazy(() => import("@/pages/Index"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const Vendors = lazy(() => import("@/pages/Vendors")); // Correctly importing Vendors

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <UserProvider>
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
                    <Route path="/vendors" element={<Vendors />} /> {/* Using the Vendors component */}
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </TransactionsProvider>
      </UserProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;