
import * as React from "react"
import { Search, Calendar, CreditCard, Tag, Store } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ParsedFilterState, parseSearchQuery } from "@/utils/searchParser"
import { format } from "date-fns"

interface ConversationalSearchInputProps {
    onUpdate: (update: Partial<ParsedFilterState>) => void
    categories: { name: string; slug: string }[]
    subCategories?: { name: string; slug: string }[]
    accounts: { name: string; slug: string; type?: string }[]
    vendors: { name: string; slug: string }[]
    currentFilters?: ParsedFilterState
    className?: string
}

type SearchStep =
    | "ROOT"
    | "CATEGORY"
    | "ACCOUNT"
    | "VENDOR"
    | "DATE"

export function ConversationalSearchInput({
    onUpdate,
    categories,
    subCategories = [],
    accounts,
    vendors,
    className
}: ConversationalSearchInputProps) {
    const [open, setOpen] = React.useState(false)
    const [step, setStep] = React.useState<SearchStep>("ROOT")
    const [input, setInput] = React.useState("")
    const [nlpDate, setNlpDate] = React.useState<ParsedFilterState['dateRange']>()

    // Reset to root when closing
    React.useEffect(() => {
        if (!open) {
            setStep("ROOT")
            setInput("")
            setNlpDate(undefined)
        }
    }, [open])

    // Live NLP Date Parsing & Flattened Search
    React.useEffect(() => {
        if (input.trim().length > 2) {
            // Check for date only
            const parserContext = { categories: [], accounts: [], subCategories: [], vendors: [] };
            const result = parseSearchQuery(input, parserContext);
            if (result.dateRange) {
                setNlpDate(result.dateRange);
            } else {
                setNlpDate(undefined);
            }
        } else {
            setNlpDate(undefined);
        }
    }, [input])

    const handleSelectType = (nextStep: SearchStep) => {
        setStep(nextStep)
        setInput("") // Clear input for the section
    }

    const handleBack = () => {
        setStep("ROOT")
        setInput("")
    }

    const handleSelectCategory = (slug: string) => {
        onUpdate({ selectedCategories: [slug] })
        setOpen(false)
    }

    const handleSelectAccount = (slug: string) => {
        onUpdate({ selectedAccounts: [slug] })
        setOpen(false)
    }

    const handleSelectVendor = (slug: string) => {
        onUpdate({ selectedVendors: [slug] })
        setOpen(false)
    }

    const handleGenericSearch = (val?: string) => {
        const query = val || input;
        if (query.trim()) {
            onUpdate({ searchTerm: query })
            setOpen(false)
        }
    }

    // Filter Lists based on Input (fuse-like behavior done by Command automatically if we render all, 
    // but optimizing for "ROOT" step showing suggestions)

    const renderRootSuggestions = () => {
        // If input is empty, show types
        if (!input.trim()) {
            return (
                <CommandGroup heading="Filter Type">
                    <CommandItem value="category" onSelect={() => handleSelectType("CATEGORY")}>
                        <Tag className="mr-2 h-4 w-4" />
                        Category
                    </CommandItem>
                    <CommandItem value="account" onSelect={() => handleSelectType("ACCOUNT")}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Account
                    </CommandItem>
                    <CommandItem value="vendor" onSelect={() => handleSelectType("VENDOR")}>
                        <Store className="mr-2 h-4 w-4" />
                        Vendor / Payee
                    </CommandItem>
                </CommandGroup>
            )
        }

        // If input exists, show NLP results + Entity Matches
        return (
            <>
                {nlpDate && (
                    <CommandGroup heading="Detected Date">
                        <CommandItem
                            value={"date-" + input}
                            onSelect={() => {
                                onUpdate({ dateRange: nlpDate });
                                setOpen(false);
                            }}
                        >
                            <Calendar className="mr-2 h-4 w-4 text-primary" />
                            Use Date: {format(nlpDate.from!, "MMM d")} - {nlpDate.to ? format(nlpDate.to, "MMM d, yyyy") : ""}
                        </CommandItem>
                    </CommandGroup>
                )}

                {/* Show top entity matches mixed in, or grouped? Command filters for us if we render them. 
                    Lets render a subset of everything if input length > 1 */}

                <CommandGroup heading="Categories">
                    {categories.map(c => (
                        <CommandItem key={c.slug} value={c.name} onSelect={() => handleSelectCategory(c.slug)}>
                            <Tag className="mr-2 h-4 w-4 opacity-50" />
                            {c.name}
                        </CommandItem>
                    ))}
                    {subCategories.map(s => (
                        <CommandItem key={'sub-' + s.slug} value={s.name} onSelect={() => onUpdate({ selectedSubCategories: [s.slug] })}>
                            <Tag className="mr-2 h-4 w-4 opacity-50" />
                            {s.name} (Sub)
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandGroup heading="Accounts">
                    {accounts.map(a => (
                        <CommandItem key={a.slug} value={a.name} onSelect={() => handleSelectAccount(a.slug)}>
                            <CreditCard className="mr-2 h-4 w-4 opacity-50" />
                            {a.name}
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandGroup heading="Vendors">
                    {/* Render all vendors for local filtering */}
                    {vendors.map(v => (
                        <CommandItem key={v.slug} value={v.name} onSelect={() => handleSelectVendor(v.slug)}>
                            <Store className="mr-2 h-4 w-4 opacity-50" />
                            {v.name}
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandGroup heading="Search">
                    <CommandItem value={"search-" + input} onSelect={() => handleGenericSearch()}>
                        <Search className="mr-2 h-4 w-4" />
                        Search Text "{input}"
                    </CommandItem>
                </CommandGroup>
            </>
        )
    }

    const renderStepContent = () => {
        // Keep explicit browsing logic if user Selected "Category" specifically
        if (step === "CATEGORY") {
            return (
                <CommandGroup heading="All Categories">
                    <CommandItem value="back" onSelect={handleBack} className="text-muted-foreground font-medium">← Back</CommandItem>
                    {categories.map(c => (
                        <CommandItem key={c.slug} value={c.name} onSelect={() => handleSelectCategory(c.slug)}>{c.name}</CommandItem>
                    ))}
                </CommandGroup>
            )
        }
        if (step === "ACCOUNT") {
            return (
                <CommandGroup heading="All Accounts">
                    <CommandItem value="back" onSelect={handleBack} className="text-muted-foreground font-medium">← Back</CommandItem>
                    {accounts.map(a => (
                        <CommandItem key={a.slug} value={a.name} onSelect={() => handleSelectAccount(a.slug)}>{a.name}</CommandItem>
                    ))}
                </CommandGroup>
            )
        }
        if (step === "VENDOR") {
            return (
                <CommandGroup heading="All Vendors">
                    <CommandItem value="back" onSelect={handleBack} className="text-muted-foreground font-medium">← Back</CommandItem>
                    {vendors.map(v => (
                        <CommandItem key={v.slug} value={v.name} onSelect={() => handleSelectVendor(v.slug)}>{v.name}</CommandItem>
                    ))}
                </CommandGroup>
            )
        }
        return renderRootSuggestions();
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-12 text-lg text-muted-foreground bg-white/80 dark:bg-background/50 backdrop-blur-md font-normal", className)}
                >
                    {step === "ROOT" ? "Filter transactions..." : `Filter by ${step.toLowerCase()}...`}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={true}>
                    <CommandInput
                        placeholder="Type to filter (e.g. 'Groceries', 'Next Week', 'Checking')..."
                        onValueChange={setInput}
                        value={input}
                        onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !input && step !== "ROOT") handleBack();
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="flex flex-col items-center gap-2 p-2" onClick={() => handleGenericSearch()}>
                                <span className="text-muted-foreground">Search text "{input}"</span>
                                <Button size="sm" variant="secondary" onClick={() => handleGenericSearch()}>Search</Button>
                            </div>
                        </CommandEmpty>
                        {renderStepContent()}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
