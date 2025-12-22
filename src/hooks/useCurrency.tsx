import { useState, useCallback } from 'react';

interface CurrencyHook {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

export const useCurrency = (): CurrencyHook => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const formatCurrency = useCallback((amount: number, currency?: string): string => {
    const effectiveCurrency = currency || selectedCurrency;
    
    // Use Intl.NumberFormat for robust formatting
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: effectiveCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Ensure the return value is explicitly the formatted string
    return formatter.format(amount);
  }, [selectedCurrency]);

  return {
    selectedCurrency,
    setSelectedCurrency,
    formatCurrency,
  };
};