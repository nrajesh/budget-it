import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NLPSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    isLoading?: boolean;
}

const PLACEHOLDERS = [
    "All transactions in past 2 weeks",
    "All Grocery transactions across checking accounts",
    "Starbucks visits last month",
    "Income this year",
    "Spending on Gas"
];

export const NLPSearchInput: React.FC<NLPSearchInputProps> = ({
    value,
    onChange,
    onClear,
    isLoading
}) => {
    const [placeholderIndex, setPlaceholderIndex] = React.useState(0);
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
        if (isFocused || value) return; // Don't rotate if user is typing or has typed

        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [isFocused, value]);

    return (
        <div className={cn(
            "relative flex items-center w-full transition-all duration-300",
            isFocused ? "scale-[1.01]" : ""
        )}>
            <div className="absolute left-3 text-muted-foreground pointer-events-none">
                <Search className={cn("size-5 transition-colors", isFocused ? "text-primary" : "")} />
            </div>

            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={PLACEHOLDERS[placeholderIndex]}
                className={cn(
                    "pl-10 pr-10 h-12 text-lg bg-white/80 dark:bg-background/50 backdrop-blur-md border-slate-200 dark:border-muted-foreground/20",
                    "hover:border-primary/50 focus-visible:border-primary focus-visible:ring-primary/20",
                    "transition-all duration-300 shadow-sm text-slate-900 dark:text-slate-100"
                )}
            />

            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 size-8 text-muted-foreground hover:text-foreground"
                    onClick={onClear}
                >
                    <X className="size-4" />
                </Button>
            )}

            {isLoading && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};
