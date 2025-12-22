import { useState } from 'react';

export const useCurrency = () => {
  const [selectedCurrency, setCurrency] = useState<string>('USD');
  const availableCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];

  const formatCurrency = (amount: number, currency?: string) => {
    // Implementation
  };

  return {
    selectedCurrency,
    setCurrency,
    availableCurrencies,
    formatCurrency
  };
};