import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/contexts/TransactionsContext";
import { ensureCategoryExists } from "@/integrations/supabase/utils";
import { useToast } from "@/components/ui/use-toast";
import { Check, Plus, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryReconciliationDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const CategoryReconciliationDialog = ({
    isOpen,
    onClose,
}: CategoryReconciliationDialogProps) => {
    const { transactions, categories, refetchCategories, subCategories, refetchSubCategories, invalidateAllData } = useTransactions();
    const { user } = useUser();
    const { toast } = useToast();

    // Missing items (to create)
    const [missingCategories, setMissingCategories] = useState<string[]>([]);
    const [missingSubCategories, setMissingSubCategories] = useState<{ category: string; subCategory: string }[]>([]);
    const [selectedMissingCats, setSelectedMissingCats] = useState<Set<string>>(new Set());
    const [selectedMissingSubs, setSelectedMissingSubs] = useState<Set<string>>(new Set());

    // Unused items (to delete)
    const [unusedCategories, setUnusedCategories] = useState<string[]>([]);
    const [unusedSubCategories, setUnusedSubCategories] = useState<{ category: string; subCategory: string; id: string }[]>([]);
    const [selectedUnusedCats, setSelectedUnusedCats] = useState<Set<string>>(new Set());
    const [selectedUnusedSubs, setSelectedUnusedSubs] = useState<Set<string>>(new Set()); // Key: ID

    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            calculateItems();
            setSelectedMissingCats(new Set());
            setSelectedMissingSubs(new Set());
            setSelectedUnusedCats(new Set());
            setSelectedUnusedSubs(new Set());
        }
    }, [isOpen, transactions, categories, subCategories]);

    const calculateItems = () => {
        const transactionCategories = new Set(transactions.map((t) => t.category).filter(Boolean));
        const systemCategoryNames = new Set(categories.map((c) => c.name));

        // 1. Missing Categories (Used in Txn but not in DB)
        const missingCats = Array.from(transactionCategories).filter(
            (name) => !systemCategoryNames.has(name)
        );
        setMissingCategories(missingCats);

        // 2. Unused Categories (In DB but not in Txn)
        const unusedCats = categories
            .filter(c => !transactionCategories.has(c.name) && c.name !== 'Others' && c.name !== 'Adjustment') // Prevent deleting crucial system categories
            .map(c => c.name);
        setUnusedCategories(unusedCats);

        // 3. Missing Sub-categories (Used in Txn but not in DB)
        const missingSubs: { category: string; subCategory: string }[] = [];
        const systemSubCatMap = new Set<string>(); // "Category:SubCategory"

        // Also track all used sub-categories from transactions: "Category:SubCategory"
        const usedSubCatKeys = new Set<string>();

        subCategories.forEach(sc => {
            const parent = categories.find(c => c.id === sc.category_id);
            if (parent) {
                systemSubCatMap.add(`${parent.name}:${sc.name}`);
            }
        });

        transactions.forEach(t => {
            if (t.category && t.sub_category) {
                usedSubCatKeys.add(`${t.category}:${t.sub_category}`);
                if (systemCategoryNames.has(t.category)) {
                    const key = `${t.category}:${t.sub_category}`;
                    if (!systemSubCatMap.has(key)) {
                        if (!missingSubs.some(item => item.category === t.category && item.subCategory === t.sub_category)) {
                            missingSubs.push({ category: t.category, subCategory: t.sub_category });
                        }
                    }
                }
            }
        });
        setMissingSubCategories(missingSubs);

        // 4. Unused Sub-categories (In DB but not in Txn)
        const unusedSubs: { category: string; subCategory: string; id: string }[] = [];
        subCategories.forEach(sc => {
            const parent = categories.find(c => c.id === sc.category_id);
            if (parent) {
                const key = `${parent.name}:${sc.name}`;
                if (!usedSubCatKeys.has(key)) {
                    unusedSubs.push({ category: parent.name, subCategory: sc.name, id: sc.id });
                }
            }
        });
        setUnusedSubCategories(unusedSubs);
    };

    const createCategory = async (name: string) => {
        if (!user?.id) throw new Error("User not found");
        await ensureCategoryExists(name, user.id);
    };

    const createSubCategory = async (categoryName: string, subCategoryName: string) => {
        if (!user?.id) throw new Error("User not found");
        const category = categories.find(c => c.name === categoryName);
        if (!category) throw new Error(`Parent category '${categoryName}' not found.`);

        const { data: existing } = await supabase
            .from('sub_categories')
            .select('id')
            .eq('category_id', category.id)
            .eq('name', subCategoryName)
            .eq('user_id', user.id)
            .single();

        if (!existing) {
            const { error } = await supabase
                .from('sub_categories')
                .insert({
                    category_id: category.id,
                    name: subCategoryName,
                    user_id: user.id
                });
            if (error) throw error;
        }
    };

    const deleteCategory = async (name: string) => {
        const cat = categories.find(c => c.name === name);
        if (!cat) return;
        const { error } = await supabase.from('categories').delete().eq('id', cat.id);
        if (error) throw error;
    };

    const deleteSubCategory = async (id: string) => {
        const { error } = await supabase.from('sub_categories').delete().eq('id', id);
        if (error) throw error;
    };

    const handleBulkCreateCats = async () => {
        if (selectedMissingCats.size === 0) return;
        setIsProcessing(true);
        try {
            const toCreate = Array.from(selectedMissingCats);
            await Promise.all(toCreate.map(name => createCategory(name)));
            toast({ title: "Categories Created", description: `Successfully created ${toCreate.length} categories.` });
            await refetchCategories();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkCreateSubs = async () => {
        if (selectedMissingSubs.size === 0) return;
        setIsProcessing(true);
        try {
            const toCreate = Array.from(selectedMissingSubs).map(key => {
                const [cat, sub] = key.split(':');
                return { cat, sub };
            });
            await Promise.all(toCreate.map(item => createSubCategory(item.cat, item.sub)));
            toast({ title: "Sub-categories Created", description: `Successfully created ${toCreate.length} sub-categories.` });
            await refetchSubCategories();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkDeleteCats = async () => {
        if (selectedUnusedCats.size === 0) return;
        setIsProcessing(true);
        try {
            const toDelete = Array.from(selectedUnusedCats);
            await Promise.all(toDelete.map(name => deleteCategory(name)));
            toast({ title: "Categories Deleted", description: `Successfully deleted ${toDelete.length} unused categories.` });
            await refetchCategories();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkDeleteSubs = async () => {
        if (selectedUnusedSubs.size === 0) return;
        setIsProcessing(true);
        try {
            const toDeleteIds = Array.from(selectedUnusedSubs);
            await Promise.all(toDeleteIds.map(id => deleteSubCategory(id)));
            toast({ title: "Sub-categories Deleted", description: `Successfully deleted ${toDeleteIds.length} unused sub-categories.` });
            await refetchSubCategories();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleSelection = (setFn: React.Dispatch<React.SetStateAction<Set<string>>>, item: string) => {
        setFn(prev => {
            const next = new Set(prev);
            if (next.has(item)) next.delete(item);
            else next.add(item);
            return next;
        });
    };

    const toggleSelectAll = (setFn: React.Dispatch<React.SetStateAction<Set<string>>>, allItems: string[], currentSet: Set<string>) => {
        if (currentSet.size === allItems.length) setFn(new Set());
        else setFn(new Set(allItems));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Reconcile Categories</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="missing" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="missing">Missing (Create)</TabsTrigger>
                        <TabsTrigger value="unused">Unused (Cleanup)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="missing" className="flex-1 overflow-y-auto p-1 space-y-6 mt-2">
                        {missingCategories.length === 0 && missingSubCategories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                                <Check className="h-12 w-12 mb-4 text-green-500" />
                                <p className="text-lg font-medium">All reconciled!</p>
                                <p className="text-sm">No missing categories or sub-categories found.</p>
                            </div>
                        ) : (
                            <>
                                {/* Missing Categories */}
                                {missingCategories.length > 0 && (
                                    <div className="border rounded-md p-4 space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded text-xs">Missing Categories</span>
                                            <span className="text-sm text-muted-foreground">({missingCategories.length})</span>
                                        </h3>
                                        <div className="flex items-center justify-between gap-4 p-2 bg-muted/40 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={selectedMissingCats.size === missingCategories.length}
                                                    onCheckedChange={() => toggleSelectAll(setSelectedMissingCats, missingCategories, selectedMissingCats)}
                                                />
                                                <span className="text-sm font-medium">Select All</span>
                                            </div>
                                            {selectedMissingCats.size > 0 && (
                                                <Button size="sm" onClick={handleBulkCreateCats} disabled={isProcessing}>
                                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                                    Create ({selectedMissingCats.size})
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            {missingCategories.map(name => (
                                                <div key={name} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                                                    <Checkbox
                                                        checked={selectedMissingCats.has(name)}
                                                        onCheckedChange={() => toggleSelection(setSelectedMissingCats, name)}
                                                    />
                                                    <span>{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Missing Sub-categories */}
                                {missingSubCategories.length > 0 && (
                                    <div className="border rounded-md p-4 space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs dark:bg-orange-900 dark:text-orange-100">Missing Sub-categories</span>
                                            <span className="text-sm text-muted-foreground">({missingSubCategories.length})</span>
                                        </h3>
                                        <div className="flex items-center justify-between gap-4 p-2 bg-muted/40 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={selectedMissingSubs.size === missingSubCategories.length}
                                                    onCheckedChange={() => toggleSelectAll(
                                                        setSelectedMissingSubs,
                                                        missingSubCategories.map(i => `${i.category}:${i.subCategory}`),
                                                        selectedMissingSubs
                                                    )}
                                                />
                                                <span className="text-sm font-medium">Select All</span>
                                            </div>
                                            {selectedMissingSubs.size > 0 && (
                                                <Button size="sm" onClick={handleBulkCreateSubs} disabled={isProcessing}>
                                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                                    Create ({selectedMissingSubs.size})
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            {missingSubCategories.map(item => {
                                                const key = `${item.category}:${item.subCategory}`;
                                                return (
                                                    <div key={key} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                                                        <Checkbox
                                                            checked={selectedMissingSubs.has(key)}
                                                            onCheckedChange={() => toggleSelection(setSelectedMissingSubs, key)}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{item.subCategory}</span>
                                                            <span className="text-xs text-muted-foreground">{item.category}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="unused" className="flex-1 overflow-y-auto p-1 space-y-6 mt-2">
                        {unusedCategories.length === 0 && unusedSubCategories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                                <Check className="h-12 w-12 mb-4 text-green-500" />
                                <p className="text-lg font-medium">No unused entities!</p>
                                <p className="text-sm">All categories and sub-categories are used in transactions.</p>
                            </div>
                        ) : (
                            <>
                                {/* Unused Categories */}
                                {unusedCategories.length > 0 && (
                                    <div className="border rounded-md p-4 space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs dark:bg-yellow-900 dark:text-yellow-100">Unused Categories</span>
                                            <span className="text-sm text-muted-foreground">({unusedCategories.length})</span>
                                        </h3>
                                        <div className="flex items-center justify-between gap-4 p-2 bg-muted/40 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={selectedUnusedCats.size === unusedCategories.length}
                                                    onCheckedChange={() => toggleSelectAll(setSelectedUnusedCats, unusedCategories, selectedUnusedCats)}
                                                />
                                                <span className="text-sm font-medium">Select All</span>
                                            </div>
                                            {selectedUnusedCats.size > 0 && (
                                                <Button size="sm" variant="destructive" onClick={handleBulkDeleteCats} disabled={isProcessing}>
                                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                                    Delete ({selectedUnusedCats.size})
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            {unusedCategories.map(name => (
                                                <div key={name} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                                                    <Checkbox
                                                        checked={selectedUnusedCats.has(name)}
                                                        onCheckedChange={() => toggleSelection(setSelectedUnusedCats, name)}
                                                    />
                                                    <span>{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Unused Sub-categories */}
                                {unusedSubCategories.length > 0 && (
                                    <div className="border rounded-md p-4 space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs dark:bg-yellow-900 dark:text-yellow-100">Unused Sub-categories</span>
                                            <span className="text-sm text-muted-foreground">({unusedSubCategories.length})</span>
                                        </h3>
                                        <div className="flex items-center justify-between gap-4 p-2 bg-muted/40 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={selectedUnusedSubs.size === unusedSubCategories.length}
                                                    onCheckedChange={() => toggleSelectAll(
                                                        setSelectedUnusedSubs,
                                                        unusedSubCategories.map(i => i.id),
                                                        selectedUnusedSubs
                                                    )}
                                                />
                                                <span className="text-sm font-medium">Select All</span>
                                            </div>
                                            {selectedUnusedSubs.size > 0 && (
                                                <Button size="sm" variant="destructive" onClick={handleBulkDeleteSubs} disabled={isProcessing}>
                                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                                    Delete ({selectedUnusedSubs.size})
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            {unusedSubCategories.map(item => (
                                                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                                                    <Checkbox
                                                        checked={selectedUnusedSubs.has(item.id)}
                                                        onCheckedChange={() => toggleSelection(setSelectedUnusedSubs, item.id)}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.subCategory}</span>
                                                        <span className="text-xs text-muted-foreground">{item.category}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default CategoryReconciliationDialog;
