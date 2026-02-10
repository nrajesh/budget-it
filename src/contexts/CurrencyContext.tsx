import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  currencySymbols,
  availableCurrencies,
  defaultExchangeRates,
} from "@/constants/currency";

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  currencySymbols: { [key: string]: string };
  availableCurrencies: { code: string; name: string }[];
  convertBetweenCurrencies: (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ) => number;
  exchangeRates: { [key: string]: number };
  updateExchangeRate: (currencyCode: string, newRate: number) => void;
  refreshExchangeRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    return localStorage.getItem("selectedCurrency") || "USD";
  });

  const [exchangeRatesState, setExchangeRatesState] = useState<{
    [key: string]: number;
  }>(() => {
    const savedRates = localStorage.getItem("currency_exchange_rates");
    return savedRates ? JSON.parse(savedRates) : defaultExchangeRates;
  });

  useEffect(() => {
    localStorage.setItem("selectedCurrency", selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    localStorage.setItem(
      "currency_exchange_rates",
      JSON.stringify(exchangeRatesState),
    );
  }, [exchangeRatesState]);

  const setCurrency = useCallback(
    (currency: string) => {
      if (exchangeRatesState[currency]) {
        setSelectedCurrency(currency);
      } else {
        console.warn(`Currency ${currency} not supported.`);
      }
    },
    [exchangeRatesState],
  );

  const updateExchangeRate = useCallback(
    (currencyCode: string, newRate: number) => {
      setExchangeRatesState((prev) => ({
        ...prev,
        [currencyCode]: newRate,
      }));
    },
    [],
  );

  const refreshExchangeRates = useCallback(async () => {
    try {
      // Using Frankfurter API (EU-based, sources from European Central Bank)
      // We request rates relative to USD to match our internal base.
      const response = await fetch(
        "https://api.frankfurter.app/latest?from=USD",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch rates");
      }
      const data = await response.json();

      // Filter only currencies we support
      const newRates: { [key: string]: number } = {};
      let hasUpdates = false;

      availableCurrencies.forEach((curr) => {
        if (data.rates[curr.code]) {
          newRates[curr.code] = data.rates[curr.code];
          hasUpdates = true;
        } else if (exchangeRatesState[curr.code]) {
          // Fallback to existing if removed from API
          newRates[curr.code] = exchangeRatesState[curr.code];
        } else {
          // Fallback to initial hardcoded
          newRates[curr.code] = defaultExchangeRates[curr.code] || 1;
        }
      });

      if (hasUpdates) {
        setExchangeRatesState(newRates);
      }
    } catch (error) {
      console.error("Failed to refresh exchange rates:", error);
      throw error; // Re-throw so UI can show toast
    }
  }, [exchangeRatesState]);

  const convertBetweenCurrencies = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string): number => {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      const fromRate = exchangeRatesState[fromCurrency];
      const toRate = exchangeRatesState[toCurrency];

      if (fromRate === undefined || toRate === undefined) {
        console.warn(
          `Exchange rate not found for conversion from ${fromCurrency} to ${toCurrency}.`,
        );
        return amount;
      }

      const amountInBase = amount / fromRate;
      return amountInBase * toRate;
    },
    [exchangeRatesState],
  );

  const formatCurrency = useCallback(
    (amount: number, currencyCode?: string): string => {
      // Normalize -0 or effectively zero values to 0 to prevent -€0.00
      if (Math.abs(amount) < 0.005) {
        amount = 0;
      }
      const displayCurrency = currencyCode || selectedCurrency;
      const symbol = currencySymbols[displayCurrency] || displayCurrency;
      return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [selectedCurrency],
  );

  const value = React.useMemo(
    () => ({
      selectedCurrency,
      setCurrency,
      formatCurrency,
      currencySymbols,
      availableCurrencies,
      convertBetweenCurrencies,
      exchangeRates: exchangeRatesState,
      updateExchangeRate,
      refreshExchangeRates,
    }),
    [
      selectedCurrency,
      setCurrency,
      formatCurrency,
      convertBetweenCurrencies,
      exchangeRatesState,
      updateExchangeRate,
      refreshExchangeRates,
    ],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
