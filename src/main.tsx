"use client";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "./index.css";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { Toaster } from "@/components/ui/sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <TransactionsProvider>
        <CurrencyProvider>
          <App />
          <Toaster />
        </CurrencyProvider>
      </TransactionsProvider>
    </Router>
  </React.StrictMode>
);