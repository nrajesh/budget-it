import { useState, useCallback } from 'react';

interface CurrencyHook {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

// Simple map for currency symbols (can be expanded)
const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const useCurrency = (): CurrencyHook => {
  // Default currency is USD, but should ideally come from user profile
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const formatCurrency = useCallback((amount: number, currency?: string): string => {
    const effectiveCurrency = currency || selectedCurrency;
    const symbol = currencySymbols[effectiveCurrency] || effectiveCurrency;

    // Use Intl.NumberFormat for robust formatting
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: effectiveCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  }, [selectedCurrency]);

  return {
    selectedCurrency,
    setSelectedCurrency,
    formatCurrency,
  };
};