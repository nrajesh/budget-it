import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from './UserContext';
import { currencies, Currency } from '@/data/currencies';

const API_KEY = import.meta.env.VITE_OPENEXCHANGERATES_API_KEY;
const BASE_URL = 'https://openexchangerates.org/api';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  exchangeRates: ExchangeRates | null;
  isLoadingRates: boolean;
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  availableCurrencies: Currency[];
  currencySymbols: { [key: string]: string };
}

export const CurrencyContext = React.createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoadingUser } = useUser();
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>('USD');

  React.useEffect(() => {
    if (user && user.default_currency) {
      setSelectedCurrency(user.default_currency);
    } else if (!isLoadingUser && !user) {
      setSelectedCurrency('USD');
    }
  }, [user, isLoadingUser]);

  const { data: exchangeRates, isLoading: isLoadingRates } = useQuery<ExchangeRates, Error>({
    queryKey: ['exchangeRates'],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/latest.json?app_id=${API_KEY}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      const data = await response.json();
      return data.rates;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });

  const convertBetweenCurrencies = React.useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    if (!exchangeRates) return amount;
    if (fromCurrency === toCurrency) return amount;

    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];

    if (fromRate && toRate) {
      const amountInUSD = amount / fromRate;
      return amountInUSD * toRate;
    }
    return amount;
  }, [exchangeRates]);

  const currencySymbols = React.useMemo(() =>
    currencies.reduce((acc, currency) => {
      acc[currency.code] = currency.symbol;
      return acc;
    }, {} as { [key: string]: string }), []);

  const formatCurrency = React.useCallback((amount: number, currencyCode: string = selectedCurrency): string => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'symbol',
      }).format(amount);
    } catch (error) {
      console.warn(`Could not format currency for ${currencyCode}. Falling back to default.`, error);
      const symbol = currencySymbols[currencyCode] || currencyCode;
      return `${symbol}${amount.toFixed(2)}`;
    }
  }, [selectedCurrency, currencySymbols]);

  const value = React.useMemo(() => ({
    selectedCurrency,
    setSelectedCurrency,
    exchangeRates,
    isLoadingRates,
    convertBetweenCurrencies,
    formatCurrency,
    availableCurrencies: currencies,
    currencySymbols,
  }), [selectedCurrency, exchangeRates, isLoadingRates, convertBetweenCurrencies, formatCurrency, currencySymbols]);

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