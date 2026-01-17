import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { CategoryNode } from "@/components/CategoryTreeFilter";
import { DateRange } from "react-day-picker";
import { NLPSearchInput } from "@/components/ui/NLPSearchInput";
import { parseSearchQuery } from "@/utils/searchParser";
import { useDebounce } from "@uidotdev/usehooks";

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
  setSelectedSubCategories: (values: string[]) => void;

  availableVendorOptions: Option[];
  selectedVendors: string[];
  setSelectedVendors: React.Dispatch<React.SetStateAction<string[]>>;
  dateRange: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  excludeTransfers: boolean;
  onExcludeTransfersChange: (exclude: boolean) => void;
  onResetFilters: () => void;
}

// Helper to flatten category tree
const flattenCategories = (nodes: CategoryNode[]): { name: string; slug: string }[] => {
  const result: { name: string; slug: string }[] = [];
  nodes.forEach(node => {
    result.push({ name: node.name, slug: node.slug });
  });
  return result;
};

// Helper to extract all subcategories
const getAllSubCategories = (nodes: CategoryNode[]): { name: string; slug: string }[] => {
  const result: { name: string; slug: string }[] = [];
  nodes.forEach(node => {
    if (node.subCategories) {
      node.subCategories.forEach(sub => {
        result.push({ name: sub.name, slug: sub.slug });
      });
    }
  });
  return result;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  availableAccountOptions,
  setSelectedAccounts,
  categoryTreeData,
  setSelectedCategories,
  setSelectedSubCategories,
  availableVendorOptions,
  setSelectedVendors,
  onDateChange,
  excludeTransfers,
  onExcludeTransfersChange,
  onResetFilters,
}) => {
  const { isFinancialPulse } = useTheme();

  // Flatten context for parser
  const parserContext = React.useMemo(() => ({
    accounts: availableAccountOptions.map(o => ({ name: o.label, slug: o.value })),
    categories: flattenCategories(categoryTreeData),
    subCategories: getAllSubCategories(categoryTreeData),
    vendors: availableVendorOptions.map(o => ({ name: o.label, slug: o.value }))
  }), [availableAccountOptions, categoryTreeData, availableVendorOptions]);

  const debouncedSearchTerm = useDebounce(searchTerm, 600);

  React.useEffect(() => {
    if (!debouncedSearchTerm) {
      return;
    }

    const result = parseSearchQuery(debouncedSearchTerm, parserContext);

    console.log("Parsed NLP Result:", result);

    // Apply Filters
    if (result.selectedAccounts) setSelectedAccounts(result.selectedAccounts);
    if (result.selectedCategories) setSelectedCategories(result.selectedCategories);

    // Handle subcategories from parser result
    if (result.selectedSubCategories) {
      // We use the prop provided to set subcategories
      setSelectedSubCategories(result.selectedSubCategories);
    }

    if (result.selectedVendors) setSelectedVendors(result.selectedVendors);
    if (result.dateRange) onDateChange(result.dateRange);

  }, [debouncedSearchTerm, parserContext, setSelectedAccounts, setSelectedCategories, setSelectedSubCategories, setSelectedVendors, onDateChange]);

  const handleClear = () => {
    setSearchTerm("");
    onResetFilters();
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full items-center bg-card p-4 rounded-xl shadow-sm border">
      {/* NLP Search Input (Takes mostly all space) */}
      <div className="flex-1 w-full">
        <NLPSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          onClear={handleClear}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4 shrink-0">
        <div className="flex items-center space-x-2">
          <Switch
            id="exclude-transfers"
            checked={excludeTransfers}
            onCheckedChange={onExcludeTransfersChange}
            className={isFinancialPulse ? "data-[state=checked]:bg-indigo-500" : ""}
          />
          <Label htmlFor="exclude-transfers" className="text-sm font-medium">Exclude Transfers</Label>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};