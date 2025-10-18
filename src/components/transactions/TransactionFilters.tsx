import * as React from "react";
import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { SearchInput } from "@/components/SearchInput";

interface Option {
  value: string;
  label: string;
}

interface TransactionFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  availableAccountOptions: Option[];
  selectedAccounts: string[];
  setSelectedAccounts: (values: string[]) => void;
  availableCategoryOptions: Option[];
  selectedCategories: string[];
  setSelectedCategories: (values: string[]) => void;
  availableVendorOptions: Option[];
  selectedVendors: string[];
  setSelectedVendors: (values: string[]) => void;
  dateRange: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  onResetFilters: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  availableAccountOptions,
  selectedAccounts,
  setSelectedAccounts,
  availableCategoryOptions,
  selectedCategories,
  setSelectedCategories,
  availableVendorOptions,
  selectedVendors,
  setSelectedVendors,
  dateRange,
  onDateChange,
  onResetFilters,
}) => {
  return (
    <div className="flex flex-col gap-4 mt-4"> {/* Container for the two rows of filters */}
      {/* First row: Search and Date Range */}
      <div className="flex flex-wrap gap-4 items-end">
        <SearchInput
          id="search-input"
          label="Search"
          placeholder="Search vendor or remarks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[160px]" // Standardized search bar width
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="date-range-filter" className="text-sm font-medium text-foreground">Date Range</label>
          <DateRangePicker
            id="date-range-filter"
            date={dateRange}
            onDateChange={onDateChange}
            className="w-[160px]" // Standardized date selector width
          />
        </div>
      </div>

      {/* Second row: Account, Category, Vendor, and Reset Button */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label htmlFor="account-filter" className="text-sm font-medium text-foreground">Account</label>
          <MultiSelectDropdown
            id="account-filter"
            options={availableAccountOptions}
            selectedValues={selectedAccounts}
            onSelectChange={setSelectedAccounts}
            placeholder="Filter by Account"
            className="w-full sm:w-[200px]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="category-filter" className="text-sm font-medium text-foreground">Category</label>
          <MultiSelectDropdown
            id="category-filter"
            options={availableCategoryOptions}
            selectedValues={selectedCategories}
            onSelectChange={setSelectedCategories}
            placeholder="Filter by Category"
            className="w-full sm:w-[200px]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="vendor-filter" className="text-sm font-medium text-foreground">Vendor</label>
          <MultiSelectDropdown
            id="vendor-filter"
            options={availableVendorOptions}
            selectedValues={selectedVendors}
            onSelectChange={setSelectedVendors}
            placeholder="Filter by Vendor"
            className="w-full sm:w-[200px]"
          />
        </div>
        <Button variant="outline" onClick={onResetFilters} className="h-10 px-4 py-2 shrink-0">
          Reset Filters
        </Button>
      </div>
    </div>
  );
};