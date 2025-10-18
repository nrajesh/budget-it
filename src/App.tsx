"use client";

import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import Index from "./pages/Index";
import About from "./pages/About";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics"; // Import the new Analytics page

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
            <Route path="transactions" element={<Transactions />} />
            <Route path="analytics" element={<Analytics />} /> {/* Add the new Analytics route */}
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;