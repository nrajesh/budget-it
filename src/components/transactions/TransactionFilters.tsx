import * as React from "react";
import { Input } from "@/components/ui/input";
import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { RotateCcw, X } from "lucide-react"; // Import X icon
import { DateRange } from "react-day-picker";

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
  availableVendorOptions: Option[]; // New prop for vendor options
  selectedVendors: string[]; // New prop for selected vendors
  setSelectedVendors: (values: string[]) => void; // New prop for setting selected vendors
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
  availableVendorOptions, // Destructure new props
  selectedVendors,
  setSelectedVendors,
  dateRange,
  onDateChange,
  onResetFilters,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-4 items-start sm:items-end flex-wrap"> {/* Adjusted alignment and added flex-wrap */}
      <div className="flex flex-col gap-2">
        <label htmlFor="search-input" className="text-sm font-medium text-foreground">Search</label>
        <Input
          id="search-input"
          placeholder="Search vendor or remarks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-[280px]" // Longer search bar
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="date-range-filter" className="text-sm font-medium text-foreground">Date Range</label>
        <DateRangePicker
          id="date-range-filter"
          date={dateRange}
          onDateChange={onDateChange}
          className="w-full sm:w-[180px]" // Smaller date selector
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="account-filter" className="text-sm font-medium text-foreground">Account</label>
        <MultiSelectDropdown
          id="account-filter"
          options={availableAccountOptions}
          selectedValues={selectedAccounts}
          onSelectChange={setSelectedAccounts}
          placeholder="Filter by Account"
          className="w-full sm:w-[200px]" // Consistent width
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
          className="w-full sm:w-[200px]" // Consistent width
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="vendor-filter" className="text-sm font-medium text-foreground">Vendor</label>
        <MultiSelectDropdown // Add new MultiSelectDropdown for vendors
          id="vendor-filter"
          options={availableVendorOptions}
          selectedValues={selectedVendors}
          onSelectChange={setSelectedVendors}
          placeholder="Filter by Vendor"
          className="w-full sm:w-[200px]" // Consistent width
        />
      </div>
      <Button variant="outline" onClick={onResetFilters} className="h-10 px-4 py-2 shrink-0"> {/* Updated reset button */}
        Reset Filters
      </Button>
    </div>
  );
};