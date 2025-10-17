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
    <div className="flex flex-col sm:flex-row gap-4 mt-4 items-end">
      <Input
        placeholder="Search vendor or remarks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm w-full"
      />
      <MultiSelectDropdown
        options={availableAccountOptions}
        selectedValues={selectedAccounts}
        onSelectChange={setSelectedAccounts}
        placeholder="Filter by Account"
      />
      <MultiSelectDropdown
        options={availableCategoryOptions}
        selectedValues={selectedCategories}
        onSelectChange={setSelectedCategories}
        placeholder="Filter by Category"
      />
      <MultiSelectDropdown // Add new MultiSelectDropdown for vendors
        options={availableVendorOptions}
        selectedValues={selectedVendors}
        onSelectChange={setSelectedVendors}
        placeholder="Filter by Vendor"
      />
      <DateRangePicker dateRange={dateRange} onDateChange={onDateChange} />
      <Button variant="outline" size="icon" onClick={onResetFilters} className="shrink-0">
        <X className="h-4 w-4" /> {/* Use X icon for reset */}
        <span className="sr-only">Reset Filters</span>
      </Button>
    </div>
  );
};