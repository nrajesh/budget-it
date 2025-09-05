import * as React from 'react';

// Mock conversion rates relative to USD
export const conversionRates: { [key: string]: number } = {
  USD: 1,
  EUR: 0.92,
  INR: 83.5,
  CHF: 0.9,
  GBP: 0.79,
};

export const currencies = Object.keys(conversionRates);

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
  convertCurrency: (amount: number) => number;
}

const CurrencyContext = React.createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = React.useState<string>('USD');

  const convertCurrency = (amount: number) => {
    const rate = conversionRates[currency] || 1;
    return amount * rate;
  };

  const formatCurrency = (amount: number) => {
    const convertedAmount = convertCurrency(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount);
  };

  const value = { currency, setCurrency, formatCurrency, convertCurrency };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = React.useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};