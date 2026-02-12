import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { DateRange } from "react-day-picker";
import { endOfMonth, startOfMonth } from "date-fns";

interface FilterContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedAccounts: string[];
  setSelectedAccounts: Dispatch<SetStateAction<string[]>>;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedSubCategories: string[];
  setSelectedSubCategories: (subCategories: string[]) => void;
  selectedVendors: string[];
  setSelectedVendors: Dispatch<SetStateAction<string[]>>;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  excludeTransfers: boolean;
  setExcludeTransfers: (exclude: boolean) => void;
  minAmount: number | undefined;
  setMinAmount: (amount: number | undefined) => void;
  maxAmount: number | undefined;
  setMaxAmount: (amount: number | undefined) => void;
  limit: number | undefined;
  setLimit: (limit: number | undefined) => void;
  sortOrder: "largest" | "smallest" | undefined;
  setSortOrder: (order: "largest" | "smallest" | undefined) => void;
  rawSearchQuery: string;
  setRawSearchQuery: (query: string) => void;
  transactionType: "income" | "expense" | undefined;
  setTransactionType: (type: "income" | "expense" | undefined) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initial State Loaders
  // Move loadState outside or keep it simple. Since it's only used in useState init, it's fine.
  const loadState = <T,>(key: string, defaultVal: T): T => {
    if (typeof window === "undefined") return defaultVal;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(`Failed to load ${key}`, e);
    }
    return defaultVal;
  };

  const loadDateRange = (): DateRange | undefined => {
    if (typeof window === "undefined")
      return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
    try {
      const saved = localStorage.getItem("filter_dateRange");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          from: parsed.from ? new Date(parsed.from) : undefined,
          to: parsed.to ? new Date(parsed.to) : undefined,
        };
      }
    } catch (e) {
      console.error("Failed to load date range", e);
    }
    return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
  };

  const [searchTerm, setSearchTerm] = useState(() =>
    loadState("filter_searchTerm", ""),
  );
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(() =>
    loadState("filter_selectedAccounts", []),
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    loadState("filter_selectedCategories", []),
  );
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    () => loadState("filter_selectedSubCategories", []),
  );
  const [selectedVendors, setSelectedVendors] = useState<string[]>(() =>
    loadState("filter_selectedVendors", []),
  );

  const [dateRange, setDateRangeState] = useState<DateRange | undefined>(
    loadDateRange,
  );

  const setDateRange = useCallback((range: DateRange | undefined) => {
    setDateRangeState(range);
    try {
      if (range) {
        localStorage.setItem("filter_dateRange", JSON.stringify(range));
      } else {
        localStorage.removeItem("filter_dateRange");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [excludeTransfers, setExcludeTransfersState] = useState(() =>
    loadState("filter_excludeTransfers", false),
  );
  const setExcludeTransfers = useCallback((val: boolean) => {
    setExcludeTransfersState(val);
    localStorage.setItem("filter_excludeTransfers", JSON.stringify(val));
  }, []);

  const [minAmount, setMinAmountState] = useState<number | undefined>(() =>
    loadState("filter_minAmount", undefined),
  );
  const setMinAmount = useCallback((val: number | undefined) => {
    setMinAmountState(val);
    if (val === undefined) localStorage.removeItem("filter_minAmount");
    else localStorage.setItem("filter_minAmount", JSON.stringify(val));
  }, []);

  const [maxAmount, setMaxAmountState] = useState<number | undefined>(() =>
    loadState("filter_maxAmount", undefined),
  );
  const setMaxAmount = useCallback((val: number | undefined) => {
    setMaxAmountState(val);
    if (val === undefined) localStorage.removeItem("filter_maxAmount");
    else localStorage.setItem("filter_maxAmount", JSON.stringify(val));
  }, []);

  const [limit, setLimit] = useState<number | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<
    "largest" | "smallest" | undefined
  >(undefined);
  const [transactionType, setTransactionType] = useState<
    "income" | "expense" | undefined
  >(undefined);

  const [rawSearchQuery, setRawSearchQueryState] = useState(() =>
    loadState("filter_rawSearchQuery", ""),
  );
  const setRawSearchQuery = useCallback((val: string) => {
    setRawSearchQueryState(val);
    localStorage.setItem("filter_rawSearchQuery", JSON.stringify(val));
  }, []);

  // Effects to save simple states
  useEffect(() => {
    localStorage.setItem("filter_searchTerm", JSON.stringify(searchTerm));
  }, [searchTerm]);
  useEffect(() => {
    localStorage.setItem(
      "filter_selectedAccounts",
      JSON.stringify(selectedAccounts),
    );
  }, [selectedAccounts]);
  useEffect(() => {
    localStorage.setItem(
      "filter_selectedCategories",
      JSON.stringify(selectedCategories),
    );
  }, [selectedCategories]);
  useEffect(() => {
    localStorage.setItem(
      "filter_selectedSubCategories",
      JSON.stringify(selectedSubCategories),
    );
  }, [selectedSubCategories]);
  useEffect(() => {
    localStorage.setItem(
      "filter_selectedVendors",
      JSON.stringify(selectedVendors),
    );
  }, [selectedVendors]);

  const contextValue = useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      selectedAccounts,
      setSelectedAccounts,
      selectedCategories,
      setSelectedCategories,
      selectedSubCategories,
      setSelectedSubCategories,
      selectedVendors,
      setSelectedVendors,
      dateRange,
      setDateRange,
      excludeTransfers,
      setExcludeTransfers,
      minAmount,
      setMinAmount,
      maxAmount,
      setMaxAmount,
      limit,
      setLimit,
      sortOrder,
      setSortOrder,
      rawSearchQuery,
      setRawSearchQuery,
      transactionType,
      setTransactionType,
    }),
    [
      searchTerm,
      selectedAccounts,
      selectedCategories,
      selectedSubCategories,
      selectedVendors,
      dateRange,
      excludeTransfers,
      minAmount,
      maxAmount,
      limit,
      sortOrder,
      rawSearchQuery,
      transactionType,
      setDateRange,
      setExcludeTransfers,
      setMinAmount,
      setMaxAmount,
      setRawSearchQuery,
    ],
  );

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
};
