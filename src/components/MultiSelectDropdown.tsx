"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Option = Record<"value" | "label", string>;

interface MultiSelectDropdownProps {
  options: Option[];
  selectedValues: string[];
  onSelectChange: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder?: string;
  id?: string;
  className?: string; // Added className prop
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onSelectChange,
  placeholder = "Select options...",
  id,
  className, // Destructure className
}: MultiSelectDropdownProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = React.useCallback(
    (option: Option) => {
      onSelectChange(prev =>
        prev.includes(option.value)
          ? prev.filter(item => item !== option.value)
          : [...prev, option.value]
      );
    },
    [onSelectChange]
  );

  const handleRemove = React.useCallback(
    (value: string) => {
      onSelectChange(prev => prev.filter(item => item !== value));
    },
    [onSelectChange]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (event.key === "Delete" || event.key === "Backspace") {
          if (input.value === "") {
            onSelectChange(prev => {
              const newSelected = [...prev];
              newSelected.pop();
              return newSelected;
            });
          }
        }
        // This is not a default behaviour of the <input /> field
        if (event.key === "Escape") {
          input.blur();
        }
      }
    },
    [onSelectChange]
  );

  const selectables = options.filter(
    option => !selectedValues.includes(option.value)
  );

  return (
    <div className={className}> {/* Apply className here */}
      <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
        <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex flex-wrap gap-1">
            {selectedValues.map(value => {
              const option = options.find(o => o.value === value);
              return (
                <Badge key={value} variant="secondary">
                  {option?.label || value}
                  <button
                    className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleRemove(value);
                      }
                    }}
                    onMouseDown={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(value);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              );
            })}
            <CommandPrimitive.Input
              ref={inputRef}
              id={id}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="relative mt-2">
          {open && selectables.length > 0 ? (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandGroup className="h-full overflow-auto">
                {selectables.map(option => {
                  return (
                    <CommandItem
                      key={option.value}
                      onMouseDown={e => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => {
                        handleSelect(option);
                        setInputValue("");
                      }}
                      className={"cursor-pointer"}
                    >
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ) : null}
        </div>
      </Command>
    </div>
  );
}