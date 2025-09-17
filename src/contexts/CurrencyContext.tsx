import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { showSuccess } from '@/utils/toast';

const BASE_CURRENCY = 'USD';

export const availableCurrencies = [
  { code: 'USD', name: 'United States Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number, currency: string) => string;
  availableCurrencies: typeof availableCurrencies;
  convertAmount: (amount: number, from?: string, to?: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`);
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }
        const data = await response.json();
        setExchangeRates(data.rates);
      } catch (error) {
        console.error("Could not fetch exchange rates:", error);
        setExchangeRates({ [BASE_CURRENCY]: 1 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  const handleSetCurrency = (currency: string) => {
    setSelectedCurrency(currency);
    showSuccess(`Currency changed to ${currency}`);
  };

  const convertAmount = (amount: number, from: string = BASE_CURRENCY, to: string = selectedCurrency): number => {
    if (isLoading || !exchangeRates || from === to) {
      return amount;
    }
    const fromRate = exchangeRates[from] || 1;
    const toRate = exchangeRates[to] || 1;
    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const value = {
    selectedCurrency,
    setCurrency: handleSetCurrency,
    formatCurrency,
    availableCurrencies,
    convertAmount,
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
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};