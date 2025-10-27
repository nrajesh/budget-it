"use client";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";
import About from "./pages/About";
import Budgets from "./pages/Budgets";
import { TransactionsProvider } from "./contexts/TransactionsContext"; // Import Provider

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <TransactionsProvider> {/* Wrap the entire application with the provider */}
        <Router>
          <nav className="p-4 bg-gray-800 text-white">
            <ul className="flex space-x-4">
              <li>
                <Link to="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Link to="/budgets" className="hover:underline">
                  Budgets
                </Link>
              </li>
            </ul>
          </nav>

          <div className="content">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/budgets" element={<Budgets />} />
            </Routes>
          </div>
        </Router>
      </TransactionsProvider>
    </QueryClientProvider>
  );
}

export default App;