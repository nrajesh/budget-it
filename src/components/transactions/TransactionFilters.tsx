import * as React from "react";
import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { SearchInput } from "@/components/SearchInput";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { CategoryTreeFilter, CategoryNode } from "@/components/CategoryTreeFilter";

interface Option {
  value: string;
  label: string;
}

interface TransactionFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  availableAccountOptions: Option[];
  selectedAccounts: string[];
  setSelectedAccounts: React.Dispatch<React.SetStateAction<string[]>>;

  // New props for CategoryTree
  categoryTreeData: CategoryNode[];
  selectedCategories: string[];
  setSelectedCategories: (values: string[]) => void;
  selectedSubCategories: string[];
  setSelectedSubCategories: (values: string[]) => void; // Expecting simple state setter or wrapper

  availableVendorOptions: Option[];
  selectedVendors: string[];
  setSelectedVendors: React.Dispatch<React.SetStateAction<string[]>>;
  dateRange: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  excludeTransfers: boolean;
  onExcludeTransfersChange: (exclude: boolean) => void;
  onResetFilters: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  availableAccountOptions,
  selectedAccounts,
  setSelectedAccounts,
  categoryTreeData,
  selectedCategories,
  setSelectedCategories,
  selectedSubCategories,
  setSelectedSubCategories,
  availableVendorOptions,
  selectedVendors,
  setSelectedVendors,
  dateRange,
  onDateChange,
  excludeTransfers,
  onExcludeTransfersChange,
  onResetFilters,
}) => {
  const { isFinancialPulse } = useTheme();

  const inputStyles = isFinancialPulse
    ? "bg-black/20 border-indigo-500/30 text-white placeholder:text-slate-400 focus-visible:ring-indigo-500"
    : "";

  const containerStyles = isFinancialPulse ? "text-white" : "";

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 w-full items-end", containerStyles)}>
      {/* Search Input */}
      <div className="lg:col-span-3">
        <SearchInput
          id="search-input"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
          inputClassName={inputStyles}
        />
      </div>

      {/* Date Range Picker */}
      <div className="lg:col-span-3">
        <DateRangePicker
          id="date-range-filter"
          date={dateRange}
          onDateChange={onDateChange}
          className="w-full"
          triggerClassName={inputStyles}
        />
      </div>

      {/* Account Filter */}
      <div className="lg:col-span-1">
        <MultiSelectDropdown
          id="account-filter"
          options={availableAccountOptions}
          selectedValues={selectedAccounts}
          onSelectChange={setSelectedAccounts}
          placeholder="Account"
          className="w-full"
          triggerClassName={inputStyles}
        />
      </div>

      {/* Category Filter - UPDATED to Tree */}
      <div className="lg:col-span-2">
        <CategoryTreeFilter
          data={categoryTreeData}
          selectedCategories={selectedCategories}
          selectedSubCategories={selectedSubCategories}
          onCategoryChange={setSelectedCategories}
          onSubCategoryChange={setSelectedSubCategories}
          triggerClassName={inputStyles}
        />
      </div>

      {/* Vendor Filter */}
      <div className="lg:col-span-1">
        <MultiSelectDropdown
          id="vendor-filter"
          options={availableVendorOptions}
          selectedValues={selectedVendors}
          onSelectChange={setSelectedVendors}
          placeholder="Vendor"
          className="w-full"
          triggerClassName={inputStyles}
        />
      </div>

      <div className="lg:col-span-2 flex items-center space-x-2 h-10">
        <Switch
          id="exclude-transfers"
          checked={excludeTransfers}
          onCheckedChange={onExcludeTransfersChange}
          className={isFinancialPulse ? "data-[state=checked]:bg-indigo-500 data-[state=unchecked]:bg-slate-700" : ""}
        />
        <Label htmlFor="exclude-transfers" className={isFinancialPulse ? "text-slate-300" : ""}>Exclude xfers</Label>
        {/* Reset Filters Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onResetFilters}
          className={cn("h-8 w-8 ml-auto text-muted-foreground hover:text-foreground", isFinancialPulse ? "hover:text-white hover:bg-white/10" : "")}
          title="Reset Filters"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};