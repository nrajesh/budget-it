import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  convertAmount: (amount: number) => number;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  currencySymbols: { [key: string]: string };
  availableCurrencies: { code: string; name: string }[];
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency: string) => number; // New function
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Mock exchange rates relative to USD (assuming all base data is in USD)
const exchangeRates: { [key: string]: number } = {
  USD: 1.0,
  EUR: 0.92, // 1 USD = 0.92 EUR
  GBP: 0.79, // 1 USD = 0.79 GBP
  JPY: 155.0, // 1 USD = 155 JPY
  CAD: 1.37, // 1 USD = 1.37 CAD
  AUD: 1.51, // 1 USD = 1.51 AUD
  CHF: 0.90, // 1 USD = 0.90 CHF
  INR: 83.5, // 1 USD = 83.5 INR
  BRL: 5.15, // 1 USD = 5.15 BRL
  CNY: 7.25, // 1 USD = 7.25 CNY
};

export const currencySymbols: { [key: string]: string } = { // Exported
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

export const availableCurrencies = [ // Exported
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

  const convertAmount = useCallback((amount: number): number => {
    const rate = exchangeRates[selectedCurrency];
    if (rate === undefined) {
      console.warn(`Exchange rate for ${selectedCurrency} not found. Returning original amount.`);
      return amount;
    }
    return amount * rate;
  }, [selectedCurrency]);

  const convertBetweenCurrencies = useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];

    if (fromRate === undefined) {
      console.warn(`Exchange rate for source currency ${fromCurrency} not found. Cannot convert.`);
      return amount;
    }
    if (toRate === undefined) {
      console.warn(`Exchange rate for target currency ${toCurrency} not found. Cannot convert.`);
      return amount;
    }

    // Convert from source currency to USD, then from USD to target currency
    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
  }, []);

  const formatCurrency = useCallback((amount: number, currencyCode?: string): string => {
    const displayCurrency = currencyCode || selectedCurrency;
    const symbol = currencySymbols[displayCurrency] || displayCurrency;
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [selectedCurrency]);

  const value = React.useMemo(() => ({
    selectedCurrency,
    setCurrency,
    convertAmount,
    formatCurrency,
    currencySymbols,
    availableCurrencies,
    convertBetweenCurrencies, // Include new function
  }), [selectedCurrency, setCurrency, convertAmount, formatCurrency, convertBetweenCurrencies]);

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