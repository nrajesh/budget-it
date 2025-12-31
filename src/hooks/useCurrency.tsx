import { useState, useCallback } from 'react';

export const useCurrency = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const formatCurrency = useCallback((amount: number, currency?: string): string => {
    const effectiveCurrency = currency || selectedCurrency;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: effectiveCurrency,
    }).format(amount);
  }, [selectedCurrency]);

  return {
    selectedCurrency,
    setSelectedCurrency,
    formatCurrency,
  };
};