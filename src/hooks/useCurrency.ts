"use client";

import React, { useState, useContext, createContext, ReactNode, useMemo } from "react";

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  availableCurrencies: string[];
  currencySymbols: Record<string, string>;
  formatCurrency: (amount: number, currency: string) => string;
  convertBetweenCurrencies: (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    accountCurrencyMap: Record<string, string>
  ) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD"); // Default currency

  const availableCurrencies = useMemo(() => ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"], []); // Example currencies

  const currencySymbols = useMemo(() => ({
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
  }), []);

  const formatCurrency = (amount: number, currency: string): string => {
    const symbol = currencySymbols[currency] || "";
    return `${symbol}${amount.toFixed(2)}`;
  };

  // Placeholder for actual conversion rates. In a real app, you'd fetch these.
  const conversionRates: Record<string, Record<string, number>> = useMemo(() => ({
    USD: { USD: 1, EUR: 0.9, GBP: 0.8, JPY: 150, CAD: 1.3, AUD: 1.5 },
    EUR: { USD: 1.1, EUR: 1, GBP: 0.9, JPY: 165, CAD: 1.4, AUD: 1.6 },
    GBP: { USD: 1.25, EUR: 1.1, GBP: 1, JPY: 180, CAD: 1.5, AUD: 1.7 },
    JPY: { USD: 0.0067, EUR: 0.006, GBP: 0.0055, JPY: 1, CAD: 0.0088, AUD: 0.01 },
    CAD: { USD: 0.75, EUR: 0.7, GBP: 0.65, JPY: 113, CAD: 1, AUD: 1.1 },
    AUD: { USD: 0.67, EUR: 0.62, GBP: 0.58, JPY: 100, CAD: 0.9, AUD: 1 },
  }), []);

  const convertBetweenCurrencies = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    accountCurrencyMap: Record<string, string> // This parameter is not directly used here, but kept for compatibility if needed elsewhere
  ): number => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = conversionRates[fromCurrency]?.[toCurrency];
    if (rate) {
      return amount * rate;
    }

    // Fallback: convert to USD first, then to target currency
    const toUsdRate = conversionRates[fromCurrency]?.["USD"];
    const fromUsdRate = conversionRates["USD"]?.[toCurrency];

    if (toUsdRate && fromUsdRate) {
      return amount * toUsdRate * fromUsdRate;
    }

    console.warn(`No direct or indirect conversion rate found for ${fromCurrency} to ${toCurrency}. Returning original amount.`);
    return amount;
  };

  const value = {
    selectedCurrency,
    setCurrency: setSelectedCurrency,
    availableCurrencies,
    currencySymbols,
    formatCurrency,
    convertBetweenCurrencies,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};