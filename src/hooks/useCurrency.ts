import { useCallback } from 'react';

export const useCurrency = () => {
  const formatCurrency = useCallback((amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  return { formatCurrency };
};