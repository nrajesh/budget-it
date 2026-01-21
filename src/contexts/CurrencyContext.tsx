import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  currencySymbols: { [key: string]: string };
  availableCurrencies: { code: string; name: string }[];
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates relative to a base currency (USD)
const exchangeRates: { [key: string]: number } = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.0,
  CAD: 1.37,
  AUD: 1.51,
  CHF: 0.90,
  INR: 83.5,
  BRL: 5.15,
  CNY: 7.25,
};

export const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  INR: '₹',
  BRL: 'R$',
  CNY: '¥',
};

export const availableCurrencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'CNY', name: 'Chinese Yuan' },
];

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    return localStorage.getItem('selectedCurrency') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('selectedCurrency', selectedCurrency);
  }, [selectedCurrency]);

  const setCurrency = useCallback((currency: string) => {
    if (exchangeRates[currency]) {
      setSelectedCurrency(currency);
    } else {
      console.warn(`Currency ${currency} not supported.`);
    }
  }, []);

  const convertBetweenCurrencies = useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];

    if (fromRate === undefined || toRate === undefined) {
      console.warn(`Exchange rate not found for conversion from ${fromCurrency} to ${toCurrency}.`);
      return amount;
    }

    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  }, []);

  const formatCurrency = useCallback((amount: number, currencyCode?: string): string => {
    // Normalize -0 or effectively zero values to 0 to prevent -€0.00
    if (Math.abs(amount) < 0.005) {
      amount = 0;
    }
    const displayCurrency = currencyCode || selectedCurrency;
    const symbol = currencySymbols[displayCurrency] || displayCurrency;
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [selectedCurrency]);

  const value = React.useMemo(() => ({
    selectedCurrency,
    setCurrency,
    formatCurrency,
    currencySymbols,
    availableCurrencies,
    convertBetweenCurrencies,
  }), [selectedCurrency, setCurrency, formatCurrency, convertBetweenCurrencies]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};