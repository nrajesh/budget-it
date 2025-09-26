import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CurrencyProvider } from "./contexts/CurrencyContext.tsx";
import { UserProvider } from "./contexts/UserContext.tsx";
import { TransactionsProvider } from "./contexts/TransactionsContext.tsx";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey="vite-ui-theme">
        <UserProvider>
          <CurrencyProvider>
            <TransactionsProvider>
              <App />
            </TransactionsProvider>
          </CurrencyProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);