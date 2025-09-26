import * as React from 'react';
import { showError } from '@/utils/toast';

// Define the structure for a currency
interface Currency {
  code: string;
  name: string;
  symbol: string;
}

// Define the structure for the exchange rates
interface ExchangeRates {
  [key: string]: number;
}

// Define the structure for the context's value
interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  currencies: Currency[];
  exchangeRates: ExchangeRates | null;
  convert: (amount: number, fromCurrency: string) => number;
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  isLoadingRates: boolean;
}

// Create the context with a default undefined value
export const CurrencyContext = React.createContext<CurrencyContextType | undefined>(undefined);

// List of supported currencies
export const supportedCurrencies: Currency[] = [
  { code: 'USD', name: 'United States Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

// Define the props for the provider component
interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  // State for the selected currency, initialized from localStorage or defaulting to 'USD'
  const [selectedCurrency, setSelectedCurrencyState] = React.useState<string>(() => {
    return localStorage.getItem('userCurrency') || 'USD';
  });

  // State for storing exchange rates
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRates | null>(null);
  const [isLoadingRates, setIsLoadingRates] = React.useState(true);

  // Function to update the selected currency and store it in localStorage
  const setSelectedCurrency = (currency: string) => {
    localStorage.setItem('userCurrency', currency);
    setSelectedCurrencyState(currency);
  };


  // Effect to fetch exchange rates when the component mounts
  React.useEffect(() => {
    const fetchRates = async () => {
      setIsLoadingRates(true);
      try {
        // Using a free, no-API-key-required service for exchange rates
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }
        const data = await response.json();
        if (data.result === 'success') {
          setExchangeRates(data.rates);
        } else {
          throw new Error('API response indicates failure');
        }
      } catch (error: any) {
        console.error('Error fetching exchange rates:', error);
        showError(`Could not load currency rates: ${error.message}. Using default USD rates.`);
        // Fallback to USD-only rates if API fails
        setExchangeRates({ 'USD': 1.0 });
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
  }, []);

  // Function to convert an amount from a given currency to the selected currency
  const convert = React.useCallback((amount: number, fromCurrency: string): number => {
    if (!exchangeRates) return amount; // Return original amount if rates aren't loaded
    if (fromCurrency === selectedCurrency) return amount;

    const rateFrom = exchangeRates[fromCurrency];
    const rateTo = exchangeRates[selectedCurrency];

    if (rateFrom && rateTo) {
      // Convert amount to USD first, then to the target currency
      const amountInUSD = amount / rateFrom;
      return amountInUSD * rateTo;
    }

    // If a rate is missing, return the original amount and log a warning
    console.warn(`Conversion rate not available for ${fromCurrency} or ${selectedCurrency}.`);
    return amount;
  }, [exchangeRates, selectedCurrency]);

  // Function to convert an amount between any two currencies
  const convertBetweenCurrencies = React.useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    if (!exchangeRates) return amount;
    if (fromCurrency === toCurrency) return amount;

    const rateFrom = exchangeRates[fromCurrency];
    const rateTo = exchangeRates[toCurrency];

    if (rateFrom && rateTo) {
      const amountInUSD = amount / rateFrom;
      return amountInUSD * rateTo;
    }

    console.warn(`Conversion rate not available for ${fromCurrency} or ${toCurrency}.`);
    return amount;
  }, [exchangeRates]);


  // Function to format an amount as a currency string
  const formatCurrency = React.useCallback((amount: number, currencyCode: string = selectedCurrency): string => {
    const currency = supportedCurrencies.find(c => c.code === currencyCode);
    const symbol = currency ? currency.symbol : '$';

    // Use Intl.NumberFormat for robust currency formatting
    return new Intl.NumberFormat(undefined, { // Use user's locale for formatting
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol'
    }).format(amount);
  }, [selectedCurrency]);


  // The value provided to the context consumers
  const value = {
    selectedCurrency,
    setSelectedCurrency,
    currencies: supportedCurrencies,
    exchangeRates,
    convert,
    convertBetweenCurrencies,
    formatCurrency,
    isLoadingRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use the CurrencyContext
export const useCurrency = () => {
  const context = React.useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};