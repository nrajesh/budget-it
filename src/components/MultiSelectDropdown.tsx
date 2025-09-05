import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Define the expected structure for an option
interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: Option[]; // These are the actual data options, without an 'All' option
  selectedValues: string[]; // These are the actual selected data values
  onSelectChange: (values: string[]) => void;
  placeholder?: string;
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onSelectChange,
  placeholder = "Select...",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = React.useState(false);

  const allOption: Option = { value: 'all', label: 'All' };
  const allActualValues = React.useMemo(() => options.map(o => o.value), [options]);
  const isAllSelected = selectedValues.length === allActualValues.length && options.length > 0;

  const handleSelect = (value: string) => {
    if (value === allOption.value) {
      if (isAllSelected) {
        onSelectChange([]); // Deselect all
      } else {
        onSelectChange(allActualValues); // Select all
      }
    } else {
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onSelectChange(newSelectedValues);
    }
  };

  const displayedBadges = React.useMemo(() => {
    if (isAllSelected && options.length > 0) {
      return [{ value: 'all', label: `${allOption.label} (${options.length})` }];
    }
    return selectedValues.map(value => options.find(o => o.value === value)).filter(Boolean) as Option[];
  }, [selectedValues, options, isAllSelected]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          {displayedBadges.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {displayedBadges.map((option) => (
                <Badge key={option.value} variant="secondary">
                  {option.label}
                </Badge>
              ))}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.length > 0 && ( // Only show 'All' if there are actual options
                <CommandItem
                  key={allOption.value}
                  onSelect={() => handleSelect(allOption.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isAllSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {allOption.label}
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}