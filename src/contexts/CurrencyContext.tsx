import * as React from 'react';
import { useUser } from './UserContext';
import { showError } from '@/utils/toast';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number; // Rate relative to a base currency (e.g., USD)
}

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currencyCode: string) => void;
  availableCurrencies: Currency[];
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency: string) => number;
  isLoadingCurrencies: boolean;
  currencySymbols: Record<string, string>;
  formatCurrency: (amount: number, currencyCode?: string) => string;
}

export const CurrencyContext = React.createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, updateDefaultCurrencyInProfile, isLoadingUser } = useUser();
  const [availableCurrencies, setAvailableCurrencies] = React.useState<Currency[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = React.useState(true);

  // Initialize selectedCurrency from userProfile or default to USD
  const selectedCurrency = userProfile?.default_currency || 'USD';

  React.useEffect(() => {
    const fetchExchangeRates = async () => {
      setIsLoadingCurrencies(true);
      try {
        // In a real application, you would fetch real-time exchange rates from an API.
        // For this demo, we'll use static rates.
        const staticCurrencies: Currency[] = [
          { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1.0 },
          { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92 },
          { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79 },
          { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 156.0 },
          { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 1.37 },
          { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 1.51 },
          { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', exchangeRate: 0.90 },
          { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', exchangeRate: 7.25 },
          { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 83.5 },
          { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', exchangeRate: 5.15 },
        ];
        setAvailableCurrencies(staticCurrencies);
      } catch (error: any) {
        showError(`Failed to fetch currencies: ${error.message}`);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };

    fetchExchangeRates();
  }, []);

  const setCurrency = React.useCallback(async (currencyCode: string) => {
    if (userProfile?.default_currency !== currencyCode) {
      await updateDefaultCurrencyInProfile(currencyCode);
    }
  }, [userProfile?.default_currency, updateDefaultCurrencyInProfile]);

  const convertBetweenCurrencies = React.useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    const fromRate = availableCurrencies.find(c => c.code === fromCurrency)?.exchangeRate;
    const toRate = availableCurrencies.find(c => c.code === toCurrency)?.exchangeRate;

    if (!fromRate || !toRate) {
      console.warn(`Exchange rate not found for ${fromCurrency} or ${toCurrency}. Returning original amount.`);
      return amount;
    }

    // Convert to base currency (e.g., USD) then to target currency
    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  }, [availableCurrencies]);

  const currencySymbols = React.useMemo(() => {
    return availableCurrencies.reduce((acc, curr) => {
      acc[curr.code] = curr.symbol;
      return acc;
    }, {} as Record<string, string>);
  }, [availableCurrencies]);

  const formatCurrency = React.useCallback((amount: number, currencyCode?: string): string => {
    const targetCurrencyCode = currencyCode || selectedCurrency;
    const currency = availableCurrencies.find(c => c.code === targetCurrencyCode);

    if (!currency) {
      console.warn(`Currency not found for code: ${targetCurrencyCode}. Falling back to default formatting.`);
      return `${amount.toFixed(2)}`; // Fallback
    }

    return new Intl.NumberFormat('en-US', { // Using en-US for consistent formatting, can be made dynamic
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, [availableCurrencies, selectedCurrency]);

  const value = React.useMemo(() => ({
    selectedCurrency,
    setCurrency,
    availableCurrencies,
    convertBetweenCurrencies,
    isLoadingCurrencies: isLoadingCurrencies || isLoadingUser, // Consider user loading as part of currency loading
    currencySymbols,
    formatCurrency,
  }), [selectedCurrency, setCurrency, availableCurrencies, convertBetweenCurrencies, isLoadingCurrencies, isLoadingUser, currencySymbols, formatCurrency]);

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