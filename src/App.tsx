import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import AnalyticsPage from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./components/theme-provider";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import Layout from "./components/Layout"; // Import Layout component

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TransactionsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </TransactionsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;