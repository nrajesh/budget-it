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
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [excludeTransfers, setExcludeTransfers] = useState(false);

    const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
    const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);

    const [limit, setLimit] = useState<number | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<'largest' | 'smallest' | undefined>(undefined);
    const [rawSearchQuery, setRawSearchQuery] = useState("");

    return (
        <FilterContext.Provider value={{
            searchTerm, setSearchTerm,
            selectedAccounts, setSelectedAccounts,
            selectedCategories, setSelectedCategories,
            selectedSubCategories, setSelectedSubCategories,
            selectedVendors, setSelectedVendors,
            dateRange, setDateRange,
            excludeTransfers, setExcludeTransfers,
            minAmount, setMinAmount,
            maxAmount, setMaxAmount,
            limit, setLimit,
            sortOrder, setSortOrder,
            rawSearchQuery, setRawSearchQuery
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilter = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error("useFilter must be used within a FilterProvider");
    }
    return context;
};
