import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Static list for use in non-React modules like services
export const availableCurrencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR',
  'PLN', 'DKK', 'HUF', 'CZK', 'ILS', 'PHP', 'THB', 'MYR', 'IDR'
];

export const currencySymbols: { [key: string]: string } = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'CHF', CNY: '¥',
  SEK: 'kr', NZD: 'NZ$', MXN: 'Mex$', SGD: 'S$', HKD: 'HK$', NOK: 'kr', KRW: '₩',
  TRY: '₺', RUB: '₽', INR: '₹', BRL: 'R$', ZAR: 'R', PLN: 'zł', DKK: 'kr',
  HUF: 'Ft', CZK: 'Kč', ILS: '₪', PHP: '₱', THB: '฿', MYR: 'RM', IDR: 'Rp',
};

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  rates: { [key: string]: number } | null;
  availableCurrencies: string[];
  currencySymbols: { [key: string]: string };
  convertBetweenCurrencies: (amount: number, from: string, to: string) => number;
  formatCurrency: (amount: number, currency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [rates, setRates] = useState<{ [key: string]: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dynamicAvailableCurrencies, setDynamicAvailableCurrencies] = useState<string[]>(availableCurrencies);

  const setCurrency = async (currency: string) => {
    setSelectedCurrency(currency);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_profile')
        .update({ default_currency: currency })
        .eq('id', user.id);
    }
  };

  useEffect(() => {
    const initializeCurrency = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profile')
          .select('default_currency')
          .eq('id', user.id)
          .single();
        if (profile?.default_currency) {
          setSelectedCurrency(profile.default_currency);
        }
      }
      setLoading(false);
    };
    initializeCurrency();
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.frankfurter.app/latest');
        const data = await response.json();
        data.rates[data.base] = 1; // Add base currency (EUR)
        setRates(data.rates);
        setDynamicAvailableCurrencies(Object.keys(data.rates).sort());
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        const fallbackRates = { 'USD': 1.07, 'EUR': 1.00, 'GBP': 0.84, 'JPY': 168.43 };
        setRates(fallbackRates);
        setDynamicAvailableCurrencies(Object.keys(fallbackRates).sort());
      }
    };
    fetchRates();
  }, []);

  const convertBetweenCurrencies = useCallback((amount: number, from: string, to: string): number => {
    if (!rates || from === to) return amount;
    const rateFrom = rates[from];
    const rateTo = rates[to];
    if (!rateFrom || !rateTo) {
      return amount;
    }
    const amountInBase = amount / rateFrom;
    return amountInBase * rateTo;
  }, [rates]);

  const formatCurrency = useCallback((amount: number, currency?: string): string => {
    const currencyCode = currency || selectedCurrency;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  }, [selectedCurrency]);

  if (loading || !rates) {
    return <div>Loading currency settings...</div>;
  }

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      setCurrency,
      rates,
      availableCurrencies: dynamicAvailableCurrencies,
      currencySymbols,
      convertBetweenCurrencies,
      formatCurrency
    }}>
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