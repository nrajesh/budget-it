import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import Analytics from "@/pages/Analytics";
import Transactions from "@/pages/Transactions";
import SettingsPage from "@/pages/SettingsPage"; // Import the new SettingsPage
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { CurrencyProvider } from "./contexts/CurrencyContext"; // Import CurrencyProvider

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TransactionsProvider>
        <CurrencyProvider> {/* Wrap with CurrencyProvider */}
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="settings" element={<SettingsPage />} /> {/* Add route for SettingsPage */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Router>
        </CurrencyProvider>
      </TransactionsProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;