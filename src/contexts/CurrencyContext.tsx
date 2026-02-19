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
import { fetchWithTimeout } from "@/utils/apiUtils";

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
  addCurrency: (
    code: string,
    name: string,
    symbol: string,
    initialRate: number,
  ) => void;
  removeCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    return localStorage.getItem("selectedCurrency") || "USD";
  });

  const [currencies, setCurrencies] = useState<
    { code: string; name: string; symbol: string }[]
  >(() => {
    const saved = localStorage.getItem("active_currencies");
    if (saved) {
      return JSON.parse(saved);
    }
    // Fallback to default available currencies + check for old custom_currencies migration
    const oldCustom = localStorage.getItem("custom_currencies");
    const parsedOldCustom = oldCustom ? JSON.parse(oldCustom) : [];

    // Map default const to state shape if needed (they match)
    const defaults = availableCurrencies.map((c) => ({
      ...c,
      symbol: currencySymbols[c.code] || c.code,
    }));

    return [...defaults, ...parsedOldCustom];
  });

  const [exchangeRatesState, setExchangeRatesState] = useState<{
    [key: string]: number;
  }>(() => {
    const savedRates = localStorage.getItem("currency_exchange_rates");
    const parsedSavedRates = savedRates ? JSON.parse(savedRates) : {};
    // Merge defaults with saved rates, prioritizing saved rates but ensuring defaults exist
    return { ...defaultExchangeRates, ...parsedSavedRates };
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

  useEffect(() => {
    localStorage.setItem("active_currencies", JSON.stringify(currencies));
  }, [currencies]);

  const allCurrencySymbols = React.useMemo(() => {
    const symbols: { [key: string]: string } = {};
    currencies.forEach((c) => {
      symbols[c.code] = c.symbol;
    });
    return symbols;
  }, [currencies]);

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

  const addCustomCurrency = useCallback(
    (code: string, name: string, symbol: string, initialRate: number) => {
      setCurrencies((prev) => {
        if (prev.some((c) => c.code === code)) return prev;
        return [...prev, { code, name, symbol }];
      });
      setExchangeRatesState((prev) => ({
        ...prev,
        [code]: initialRate,
      }));
    },
    [],
  );

  const removeCustomCurrency = useCallback(
    (code: string) => {
      // Prevent removing the currently selected base currency
      if (code === selectedCurrency) {
        // Should ideally warn UI, but for now just ignore
        console.warn("Cannot remove active base currency");
        return;
      }

      setCurrencies((prev) => prev.filter((c) => c.code !== code));
      // Optional: Remove from exchange rates, or keep it (doesn't hurt)
    },
    [selectedCurrency],
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
      const response = await fetchWithTimeout(
        "https://api.frankfurter.app/latest?from=USD",
        {},
        5000,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch rates");
      }
      const data = await response.json();

      // Filter only currencies we support
      const newRates: { [key: string]: number } = {};
      let hasUpdates = false;

      // Check all active currencies
      currencies.forEach((curr) => {
        if (data.rates[curr.code]) {
          newRates[curr.code] = data.rates[curr.code];
          hasUpdates = true;
        } else if (exchangeRatesState[curr.code]) {
          // Fallback to existing
          newRates[curr.code] = exchangeRatesState[curr.code];
        } else {
          // Fallback to initial hardcoded or 1
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
  }, [exchangeRatesState, currencies]);

  const convertBetweenCurrencies = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string): number => {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      const fromRate = exchangeRatesState[fromCurrency];
      const toRate = exchangeRatesState[toCurrency];

      // Fallback for missing rates to prevent crashes/NaN
      const safeFromRate = fromRate ?? 1;
      const safeToRate = toRate ?? 1;

      if (fromRate === undefined || toRate === undefined) {
        // Only warn if it's not a temporary render state
        console.warn(
          `Exchange rate not found for conversion from ${fromCurrency} (${fromRate}) to ${toCurrency} (${toRate}). Using fallback 1.0`,
        );
      }

      const amountInBase = amount / safeFromRate;
      return amountInBase * safeToRate;
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
      const symbol = allCurrencySymbols[displayCurrency] || displayCurrency;
      return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [selectedCurrency, allCurrencySymbols],
  );

  const value = React.useMemo(
    () => ({
      selectedCurrency,
      setCurrency,
      formatCurrency,
      currencySymbols: allCurrencySymbols,
      availableCurrencies: currencies, // Use the state here
      convertBetweenCurrencies,
      exchangeRates: exchangeRatesState,
      updateExchangeRate,
      refreshExchangeRates,
      addCurrency: addCustomCurrency,
      removeCurrency: removeCustomCurrency,
    }),
    [
      selectedCurrency,
      setCurrency,
      formatCurrency,
      convertBetweenCurrencies,
      exchangeRatesState,
      updateExchangeRate,
      refreshExchangeRates,
      allCurrencySymbols,
      currencies,
      addCustomCurrency,
      removeCustomCurrency,
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
