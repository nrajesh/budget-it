"use client";

import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import Index from "./pages/Index";
import About from "./pages/About";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import { TransactionsProvider } from "./contexts/TransactionsContext"; // Import the TransactionsProvider

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;