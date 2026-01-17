import * as React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { CategoryNode } from "@/components/CategoryTreeFilter";
import { DateRange } from "react-day-picker"; // Add missing import if needed for types
import { NLPSearchInput } from "@/components/ui/NLPSearchInput";
import { parseSearchQuery } from "@/utils/searchParser";
import { useDebounce } from "@uidotdev/usehooks"; // Or write a simple debounce effect

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
  let result: { name: string; slug: string }[] = [];
  nodes.forEach(node => {
    result.push({ name: node.name, slug: node.slug });
    if (node.subCategories) {
      result = result.concat(flattenCategories(node.subCategories));
    }
  });
  return result;
};

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
    vendors: availableVendorOptions.map(o => ({ name: o.label, slug: o.value }))
  }), [availableAccountOptions, categoryTreeData, availableVendorOptions]);

  // Debounced parsing
  // Since we don't have useDebounce installed locally in common deps usually, I'll use a useEffect with setTimeout.

  React.useEffect(() => {
    // Only parse if there is a search term. If empty, we might want to reset or do nothing?
    // If empty, the parser returns "all" defaults or empty lists.
    // The user requirement: "If no time is mentioned consider current calendar month" -> parser handles this.
    // But we need to avoid overwriting manual selections if the user hasn't typed anything yet?
    // Actually, "NLP search will imply no messy dropdowns" -> means the Search Bar IS the controller.
    // So yes, the search bar dictates the state.

    // We debounce to avoid rapid state updates.
    const timer = setTimeout(() => {
      if (!searchTerm) {
        // If empty, maybe we don't overwrite? Or we set to default defaults?
        // "If no time is mentioned..."
        // If the user clears the box, onResetFilters is usually called via the 'X' button or manually.
        // But if they backspace to empty...
        // Let's assume we parse empty string -> Parser returns current month default.
        // But we should be careful not to trigger this on *mount* if there's already state.
        // Since searchTerm is controlled, this runs when searchTerm changes.
        return;
      }

      const result = parseSearchQuery(searchTerm, parserContext);

      // We only apply if there's a meaningful change? 
      // Or just apply.

      // NOTE: If the user explicitly selects "Food" via a click (if we had dropdowns), typing "Amazon" would overwrite it.
      // Since we REMOVED dropdowns, typing is the ONLY way (besides Reset).
      // So overwriting is correct.

      console.log("Parsed NLP Result:", result);

      // Apply Filters
      if (result.selectedAccounts) setSelectedAccounts(result.selectedAccounts);
      if (result.selectedCategories) setSelectedCategories(result.selectedCategories);
      if (result.selectedVendors) setSelectedVendors(result.selectedVendors);
      if (result.dateRange) onDateChange(result.dateRange);

    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, parserContext, setSelectedAccounts, setSelectedCategories, setSelectedVendors, onDateChange]);

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