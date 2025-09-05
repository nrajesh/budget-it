import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { SessionContextProvider, useSession } from "./contexts/SessionContext"; // Import SessionContextProvider and useSession
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy load page components
const Index = lazy(() => import("@/pages/Index"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login")); // Import Login page

// AuthWrapper component to handle redirection
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        navigate("/login", { replace: true });
      } else if (session && window.location.pathname === "/login") {
        navigate("/", { replace: true });
      }
    }
  }, [session, isLoading, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <Login />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SessionContextProvider> {/* Wrap with SessionContextProvider */}
        <TransactionsProvider>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<Login />} /> {/* Login route */}
                <Route
                  path="/*" // Catch all other routes
                  element={
                    <AuthWrapper>
                      <Layout />
                    </AuthWrapper>
                  }
                >
                  <Route index element={<Index />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} /> {/* Catch-all for non-existent routes within authenticated routes */}
                </Route>
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