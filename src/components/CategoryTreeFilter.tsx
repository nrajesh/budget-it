"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

// Helper to deduce sub-categories for a category.
// Since we don't have a direct map passed in, we might need to derive it or accept a map.
// For now, let's assume we pass a map or structured data.
// Actually, looking at the prompt, "Can sub-category be selectable within category itself (tree structure)?"
// This implies we need to know which sub-categories belong to which category.
// The current data model has `SubCategory` type linked to `category_id`.
// But `TransactionFilters` receives flat lists.
// I will need to update `TransactionFilters` to receive structured category data.

// Let's define the prop structure we NEED.
export interface CategoryNode {
    id: string; // db id
    name: string; // display name
    slug: string; // for filtering
    subCategories: { id: string; name: string; slug: string }[];
}

interface CategoryTreeFilterPropsStructured {
    data: CategoryNode[];
    selectedCategories: string[]; // slugs
    selectedSubCategories: string[]; // slugs (of sub-categories)
    onCategoryChange: (categorySlugs: string[]) => void;
    onSubCategoryChange: (subCategorySlugs: string[]) => void;
    className?: string;
    triggerClassName?: string;
}

export function CategoryTreeFilter({
    data = [],
    selectedCategories = [],
    selectedSubCategories = [],
    onCategoryChange,
    onSubCategoryChange,
    className,
    triggerClassName,
}: CategoryTreeFilterPropsStructured) {
    const [open, setOpen] = React.useState(false);

    // Helper: toggle category
    const toggleCategory = (categorySlug: string) => {
        const categoryNode = data.find(c => c.slug === categorySlug);
        if (!categoryNode) return;

        const isSelected = selectedCategories.includes(categorySlug);
        let newCategories = [...selectedCategories];
        let newSubCategories = [...selectedSubCategories];

        if (isSelected) {
            // DESELECT: Remove category and ALL its sub-categories
            newCategories = newCategories.filter(c => c !== categorySlug);
            const subSlugs = categoryNode.subCategories.map(s => s.slug);
            newSubCategories = newSubCategories.filter(s => !subSlugs.includes(s));
        } else {
            // SELECT: Add category and ALL its sub-categories
            newCategories.push(categorySlug);
            const subSlugs = categoryNode.subCategories.map(s => s.slug);
            // Add only unique new ones
            subSlugs.forEach(s => {
                if (!newSubCategories.includes(s)) {
                    newSubCategories.push(s);
                }
            });
        }

        onCategoryChange(newCategories);
        onSubCategoryChange(newSubCategories);
    };

    // Helper: toggle sub-category
    const toggleSubCategory = (categorySlug: string, subCategorySlug: string) => {
        const isSelected = selectedSubCategories.includes(subCategorySlug);
        let newSubCategories = [...selectedSubCategories];
        let newCategories = [...selectedCategories];

        if (isSelected) {
            // Deselect sub-category
            newSubCategories = newSubCategories.filter(s => s !== subCategorySlug);
            // NOTE: We keep the category selected even if some sub-categories are unchecked,
            // UNLESS we want "Category Selected" to mean "All Sub-categories Selected".
            // Usually, if I uncheck a sub-category, the category itself is still "active" in the filter, 
            // but the specific sub-category exclusion applies. 
            // HOWEVER, typically "Category" filter implies "Files with this category".
            // If we uncheck a sub-cat, do we uncheck the parent category?
            // If we uncheck parent, we filter OUT everything.
            // If we uncheck sub, we filter OUT just that sub.
            // Let's assume: Category must be selected for any sub-category to show? 
            // Or: Sub-category selection implies Category selection.

            // Let's go with: Deselecting a sub-cat keeps category selected.
            // But if ALL sub-cats are deselected, do we deselect category? Maybe.
            // For now, simple toggle.
        } else {
            // Select sub-category
            newSubCategories.push(subCategorySlug);
            // Ensure parent category is selected
            if (!newCategories.includes(categorySlug)) {
                newCategories.push(categorySlug);
            }
        }

        // Check if we should auto-select/deselect parent?
        // Let's simply update state.
        onSubCategoryChange(newSubCategories);
        onCategoryChange(newCategories);
    };

    const count = selectedCategories.length + selectedSubCategories.length;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("justify-between w-full font-normal", triggerClassName)}
                >
                    {selectedCategories.length === 0
                        ? "Filter categories..."
                        : `${selectedCategories.length} categories selected`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search category..." />
                    <CommandList className="max-h-[300px] overflow-auto custom-scrollbar">
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                            {data.map((category) => {
                                const isCatSelected = selectedCategories.includes(category.slug);
                                return (
                                    <React.Fragment key={category.id}>
                                        <CommandItem
                                            onSelect={() => toggleCategory(category.slug)}
                                            className="font-semibold flex items-center justify-between py-2"
                                        >
                                            <div className="flex items-center">
                                                <div
                                                    className={cn(
                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                        isCatSelected
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50 [&_svg]:invisible"
                                                    )}
                                                >
                                                    <Check className={cn("h-4 w-4")} />
                                                </div>
                                                {category.name}
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {category.subCategories.length} subs
                                            </span>
                                        </CommandItem>

                                        {/* Render Sub-categories */}
                                        {isCatSelected && category.subCategories.length > 0 && (
                                            <div className="ml-6 border-l-2 border-muted pl-2 space-y-1 mb-2">
                                                {category.subCategories.map((sub) => {
                                                    const isSubSelected = selectedSubCategories.includes(sub.slug);
                                                    return (
                                                        <div
                                                            key={sub.id}
                                                            className="flex items-center space-x-2 px-2 py-1 rounded-sm hover:bg-accent cursor-pointer text-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSubCategory(category.slug, sub.slug);
                                                            }}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "flex h-3 w-3 items-center justify-center rounded-sm border border-primary",
                                                                    isSubSelected
                                                                        ? "bg-primary text-primary-foreground"
                                                                        : "opacity-50 [&_svg]:invisible"
                                                                )}
                                                            >
                                                                <Check className={cn("h-3 w-3")} />
                                                            </div>
                                                            <span>{sub.name}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
