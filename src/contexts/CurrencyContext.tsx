"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export const availableCurrencies = ["USD", "EUR", "GBP", "JPY", "INR"];

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  availableCurrencies: string[];
  formatCurrency: (amount: number, currencyCode?: string) => string;
  convertBetweenCurrencies: (amount: number, from: string, to: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Placeholder for real exchange rates
const exchangeRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 157,
  INR: 83.5,
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrency, setCurrency] = useState('USD');

  const formatCurrency = useCallback((amount: number, currencyCode?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || selectedCurrency,
    }).format(amount);
  }, [selectedCurrency]);

  const convertBetweenCurrencies = useCallback((amount: number, from: string, to: string) => {
    const amountInUSD = amount / (exchangeRates[from] || 1);
    return amountInUSD * (exchangeRates[to] || 1);
  }, []);

  return (
    <CurrencyContext.Provider value={{ 
      selectedCurrency, 
      setCurrency, 
      availableCurrencies,
      formatCurrency,
      convertBetweenCurrencies
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};