"use client";

import * as React from "react";
import { Check } from "lucide-react"; // Removed X icon as it's no longer used

import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

type Option = Record<"value" | "label", string>;

interface MultiSelectDropdownProps {
  options: Option[];
  selectedValues: string[];
  onSelectChange: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder?: string;
  id?: string;
  className?: string; // Container class
  triggerClassName?: string; // Trigger/Input area class
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onSelectChange,
  placeholder = "Select options...",
  id,
  className,
  triggerClassName,
}: MultiSelectDropdownProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = React.useCallback(
    (option: Option) => {
      onSelectChange((prev) =>
        prev.includes(option.value)
          ? prev.filter((item) => item !== option.value)
          : [...prev, option.value],
      );
    },
    [onSelectChange],
  );

  // Removed handleRemove and handleKeyDown for badge interaction

  // ... (assuming standard import exists or I will add it)

  return (
    <div className={className}>
      <Command
        onKeyDown={() => {
          /* Keep Command for general key handling */
        }}
        className="overflow-visible bg-transparent"
      >
        <div
          className={cn(
            "group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-10 flex items-center",
            triggerClassName,
          )}
        >
          <div className="flex flex-wrap gap-1">
            {/* Removed selectedValues.map for badges */}
            <CommandPrimitive.Input
              ref={inputRef}
              id={id}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              placeholder={
                selectedValues.length > 0
                  ? `${selectedValues.length} selected`
                  : placeholder
              }
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="relative mt-2">
          {open &&
            options.length > 0 && ( // Show dropdown if open and options exist
              <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                <CommandGroup className="h-full overflow-auto">
                  {options.map((option) => {
                    // Iterate over all options
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onSelect={() => {
                          handleSelect(option);
                          setInputValue(""); // Clear input after selection
                        }}
                        className={
                          "cursor-pointer flex items-center justify-between"
                        }
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check className="h-4 w-4" />}{" "}
                        {/* Display checkmark for selected items */}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            )}
        </div>
      </Command>
    </div>
  );
}
