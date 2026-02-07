import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
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
    sortOrder: 'largest' | 'smallest' | undefined;
    setSortOrder: (order: 'largest' | 'smallest' | undefined) => void;
    rawSearchQuery: string;
    setRawSearchQuery: (query: string) => void;
    transactionType: 'income' | 'expense' | undefined;
    setTransactionType: (type: 'income' | 'expense' | undefined) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initial State Loaders
    const loadState = <T,>(key: string, defaultVal: T): T => {
        if (typeof window === 'undefined') return defaultVal;
        try {
            const saved = localStorage.getItem(key);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error(`Failed to load ${key}`, e);
        }
        return defaultVal;
    };

    const loadDateRange = (): DateRange | undefined => {
        if (typeof window === 'undefined') return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
        try {
            const saved = localStorage.getItem('filter_dateRange');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    from: parsed.from ? new Date(parsed.from) : undefined,
                    to: parsed.to ? new Date(parsed.to) : undefined
                };
            }
        } catch (e) {
            console.error("Failed to load date range", e);
        }
        return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
    };

    const [searchTerm, setSearchTerm] = useState(() => loadState('filter_searchTerm', ""));
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>(() => loadState('filter_selectedAccounts', []));
    const [selectedCategories, setSelectedCategories] = useState<string[]>(() => loadState('filter_selectedCategories', []));
    const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(() => loadState('filter_selectedSubCategories', []));
    const [selectedVendors, setSelectedVendors] = useState<string[]>(() => loadState('filter_selectedVendors', []));

    const [dateRange, setDateRangeState] = useState<DateRange | undefined>(loadDateRange);

    // Wrapper to persist date range
    const setDateRange = (range: DateRange | undefined) => {
        let newRange = range;
        if (!newRange) {
            newRange = {
                from: startOfMonth(new Date()),
                to: endOfMonth(new Date()),
            };
        }
        setDateRangeState(newRange);
        try {
            localStorage.setItem('filter_dateRange', JSON.stringify(newRange));
        } catch (e) { console.error(e); }
    };

    const [excludeTransfers, setExcludeTransfersState] = useState(() => loadState('filter_excludeTransfers', false));
    const setExcludeTransfers = (val: boolean) => {
        setExcludeTransfersState(val);
        localStorage.setItem('filter_excludeTransfers', JSON.stringify(val));
    };

    const [minAmount, setMinAmountState] = useState<number | undefined>(() => loadState('filter_minAmount', undefined));
    const setMinAmount = (val: number | undefined) => {
        setMinAmountState(val);
        if (val === undefined) localStorage.removeItem('filter_minAmount');
        else localStorage.setItem('filter_minAmount', JSON.stringify(val));
    };

    const [maxAmount, setMaxAmountState] = useState<number | undefined>(() => loadState('filter_maxAmount', undefined));
    const setMaxAmount = (val: number | undefined) => {
        setMaxAmountState(val);
        if (val === undefined) localStorage.removeItem('filter_maxAmount');
        else localStorage.setItem('filter_maxAmount', JSON.stringify(val));
    };

    const [limit, setLimit] = useState<number | undefined>(undefined); // Usually ephemeral?
    const [sortOrder, setSortOrder] = useState<'largest' | 'smallest' | undefined>(undefined);

    const [rawSearchQuery, setRawSearchQueryState] = useState(() => loadState('filter_rawSearchQuery', ""));
    const setRawSearchQuery = (val: string) => {
        setRawSearchQueryState(val);
        localStorage.setItem('filter_rawSearchQuery', JSON.stringify(val));
    };

    const [transactionType, setTransactionType] = useState<'income' | 'expense' | undefined>(undefined);

    // Effects to save simple states
    React.useEffect(() => { localStorage.setItem('filter_searchTerm', JSON.stringify(searchTerm)); }, [searchTerm]);
    React.useEffect(() => { localStorage.setItem('filter_selectedAccounts', JSON.stringify(selectedAccounts)); }, [selectedAccounts]);
    React.useEffect(() => { localStorage.setItem('filter_selectedCategories', JSON.stringify(selectedCategories)); }, [selectedCategories]);
    React.useEffect(() => { localStorage.setItem('filter_selectedSubCategories', JSON.stringify(selectedSubCategories)); }, [selectedSubCategories]);
    React.useEffect(() => { localStorage.setItem('filter_selectedVendors', JSON.stringify(selectedVendors)); }, [selectedVendors]);


    return (
        <FilterContext.Provider value={{
            searchTerm, setSearchTerm,
            selectedAccounts, setSelectedAccounts,
            selectedCategories, setSelectedCategories,
            selectedSubCategories, setSelectedSubCategories,
            selectedVendors, setSelectedVendors,
            dateRange,
            setDateRange,
            excludeTransfers, setExcludeTransfers,
            minAmount, setMinAmount,
            maxAmount, setMaxAmount,
            limit, setLimit,
            sortOrder, setSortOrder,
            rawSearchQuery, setRawSearchQuery,
            transactionType, setTransactionType
        }}>
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
