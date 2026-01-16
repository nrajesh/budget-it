import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { DateRange } from "react-day-picker";
import { endOfMonth } from "date-fns";

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
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        to: endOfMonth(new Date()),
    });
    const [excludeTransfers, setExcludeTransfers] = useState(false);

    return (
        <FilterContext.Provider value={{
            searchTerm, setSearchTerm,
            selectedAccounts, setSelectedAccounts,
            selectedCategories, setSelectedCategories,
            selectedSubCategories, setSelectedSubCategories,
            selectedVendors, setSelectedVendors,
            dateRange, setDateRange,
            excludeTransfers, setExcludeTransfers
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
