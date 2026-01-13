"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  options: { value: string; label: string; disabled?: boolean }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  consumeEscapeEvent?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder,
  searchPlaceholder,
  emptyPlaceholder = "No results found.",
  disabled,
  className,
  onKeyDown,
  consumeEscapeEvent = true,
}: ComboboxProps & { onCreate?: (value: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const selectedOption = options.find((option) => option.value === value);

  React.useEffect(() => {
    // When the component mounts or value changes, set the input value to the label of the selected option
    if (selectedOption) {
      setInputValue(selectedOption.label);
    } else if (value) {
      setInputValue(value);
    }
  }, [selectedOption, value]);

  return (
    <div className={className}>
      <Command className="overflow-visible bg-transparent">
        <div
          className={cn(
            "group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex flex-wrap gap-1">
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={(e) => {
                const shouldStop = consumeEscapeEvent ?? true;
                if (e.key === "Escape" && open) {
                  setOpen(false);
                  if (shouldStop) {
                    e.stopPropagation();
                  }
                  // If we don't stop propagation, the event bubbles up. 
                  // onKeyDown callback is called below if provided.
                }

                if (onKeyDown) {
                  onKeyDown(e);
                }
              }}
              onBlur={() => {
                // Give time for item selection to register
                setTimeout(() => {
                  setOpen(false);
                  if (selectedOption) {
                    setInputValue(selectedOption.label);
                  } else if (value) {
                    setInputValue(value);
                  } else {
                    setInputValue("");
                  }
                }, 200);
              }}
              onFocus={() => {
                setOpen(true);
              }}
              placeholder={searchPlaceholder || placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground ml-1"
            />
          </div>
        </div>
        <div className="relative mt-2">
          {open && (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
              <CommandGroup className="h-full max-h-[200px] overflow-auto">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value);
                      setInputValue(option.label);
                      setOpen(false);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    disabled={option.disabled}
                    className={cn(
                      "cursor-pointer flex items-center justify-between",
                      option.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span>{option.label}</span>
                    {value === option.value && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}

                {onCreate && inputValue.trim() !== "" && !options.some(opt => opt.label.toLowerCase() === inputValue.toLowerCase()) && (
                  <CommandItem
                    key="create-new-option"
                    value={inputValue}
                    onSelect={() => {
                      onCreate(inputValue);
                      setInputValue(inputValue);
                      setOpen(false);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="cursor-pointer font-medium text-primary"
                  >
                    Create "{inputValue}"
                  </CommandItem>
                )}

                {options.length > 0 && (
                  // If items are filtered out, cmdk shows nothing.
                  // We need an Empty component that shows when no matches.
                  <div className="hidden last:block py-6 text-center text-sm">{emptyPlaceholder}</div>
                )}
              </CommandGroup>
            </div>
          )}
        </div>
      </Command>
    </div>
  );
}