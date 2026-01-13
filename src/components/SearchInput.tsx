import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string; // Class for the container
  inputClassName?: string; // Class for the input element
}

export const SearchInput: React.FC<SearchInputProps> = ({
  label,
  id,
  value,
  onChange,
  placeholder = "Search...",
  className,
  inputClassName,
  ...props
}) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={cn("pl-9", inputClassName)}
          {...props}
        />
      </div>
    </div>
  );
};