import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";

interface MultiSelectDropdownProps {
  title: string;
  options: string[];
  selectedOptions: string[];
  onToggleOption: (option: string) => void;
  onToggleAll: () => void;
  className?: string;
}

export function MultiSelectDropdown({
  title,
  options,
  selectedOptions,
  onToggleOption,
  onToggleAll,
  className,
}: MultiSelectDropdownProps) {
  const allSelected = options.length > 0 && options.length === selectedOptions.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          {title} ({selectedOptions.length} / {options.length})
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <label
            htmlFor={`select-all-${title.toLowerCase()}`}
            className="flex items-center space-x-2 w-full cursor-pointer"
          >
            <Checkbox
              id={`select-all-${title.toLowerCase()}`}
              checked={allSelected}
              onCheckedChange={onToggleAll}
            />
            <span className="font-semibold">Select All</span>
          </label>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const id = `${title.toLowerCase()}-${option.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <DropdownMenuItem key={id} onSelect={(e) => e.preventDefault()}>
              <label
                htmlFor={id}
                className="flex items-center space-x-2 w-full cursor-pointer"
              >
                <Checkbox
                  id={id}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={() => onToggleOption(option)}
                />
                <span>{option}</span>
              </label>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}