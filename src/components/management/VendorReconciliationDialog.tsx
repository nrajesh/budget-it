import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/contexts/TransactionsContext";
import { ensurePayeeExists } from "@/integrations/supabase/utils";
import { useToast } from "@/components/ui/use-toast";
import { Check, Plus, Loader2, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface VendorReconciliationDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const VendorReconciliationDialog = ({
    isOpen,
    onClose,
}: VendorReconciliationDialogProps) => {
    const { transactions, vendors, accounts, refetchVendors } = useTransactions();
    const { toast } = useToast();

    // Missing (to create)
    const [missingVendors, setMissingVendors] = useState<string[]>([]);
    const [selectedMissing, setSelectedMissing] = useState<Set<string>>(new Set());

    // Unused (to delete)
    const [unusedVendors, setUnusedVendors] = useState<{ id: string; name: string }[]>([]);
    const [selectedUnused, setSelectedUnused] = useState<Set<string>>(new Set());

    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            calculateItems();
            setSelectedMissing(new Set());
            setSelectedUnused(new Set());
        }
    }, [isOpen, transactions, vendors, accounts]);

    const calculateItems = () => {
        const transactionVendors = new Set(transactions.map((t) => t.vendor).filter(Boolean));
        // 1. Missing Vendors (In Txn but not in DB)
        // Note: previous logic checked accounts too to avoid creating duplicate "vendor" if account exists.
        const allSystemNames = new Set([...vendors.map(v => v.name), ...accounts.map(a => a.name)]);
        const missing = Array.from(transactionVendors).filter(
            (name) => !allSystemNames.has(name)
        );
        setMissingVendors(missing);

        // 2. Unused Vendors (In DB but not in Txn)
        // We only look at `vendors` list. 
        // NOTE: totalTransactions might be stale if not refreshed, so we double check against current `transactions` list to be safe.
        const unused = vendors.filter(v => {
            if (v.name === 'Others') return false;
            return !transactionVendors.has(v.name);
        }).map(v => ({ id: v.id, name: v.name }));
        setUnusedVendors(unused);
    };

    const createVendor = async (name: string) => {
        await ensurePayeeExists(name, false);
    };

    const deleteVendor = async (id: string) => {
        // Use RPC or direct delete. Direct delete is fine for simple cleanup.
        // Assuming no constraints block it (we checked usage).
        const { error } = await supabase.from('vendors').delete().eq('id', id);
        if (error) throw error;
    };

    const handleBulkCreate = async () => {
        if (selectedMissing.size === 0) return;
        setIsProcessing(true);
        try {
            const vendorsToCreate = Array.from(selectedMissing);
            await Promise.all(vendorsToCreate.map(name => createVendor(name)));
            toast({ title: "Vendors Created", description: `Successfully created ${vendorsToCreate.length} vendors.` });
            await refetchVendors();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUnused.size === 0) return;
        setIsProcessing(true);
        try {
            const idsToDelete = Array.from(selectedUnused);
            await Promise.all(idsToDelete.map(id => deleteVendor(id)));
            toast({ title: "Vendors Deleted", description: `Successfully deleted ${idsToDelete.length} unused vendors.` });
            await refetchVendors();
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
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Reconcile Vendors</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="missing" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="missing">Missing (Create)</TabsTrigger>
                        <TabsTrigger value="unused">Unused (Cleanup)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="missing" className="flex-1 overflow-y-auto p-4 border rounded-md mt-2">
                        {missingVendors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                                <Check className="h-8 w-8 mb-2" />
                                <p>All transaction vendors exist in the system.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4 p-2 bg-muted/40 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={selectedMissing.size === missingVendors.length}
                                            onCheckedChange={() => toggleSelectAll(setSelectedMissing, missingVendors, selectedMissing)}
                                        />
                                        <span className="text-sm font-medium">Select All</span>
                                    </div>
                                    {selectedMissing.size > 0 && (
                                        <Button size="sm" onClick={handleBulkCreate} disabled={isProcessing}>
                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                            Create ({selectedMissing.size})
                                        </Button>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    {missingVendors.map(name => (
                                        <div key={name} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                                            <Checkbox
                                                checked={selectedMissing.has(name)}
                                                onCheckedChange={() => toggleSelection(setSelectedMissing, name)}
                                            />
                                            <span className="font-medium cursor-pointer" onClick={() => toggleSelection(setSelectedMissing, name)}>{name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="unused" className="flex-1 overflow-y-auto p-4 border rounded-md mt-2">
                        {unusedVendors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                                <Check className="h-8 w-8 mb-2" />
                                <p>No unused vendors found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4 p-2 bg-muted/40 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={selectedUnused.size === unusedVendors.length}
                                            onCheckedChange={() => toggleSelectAll(setSelectedUnused, unusedVendors.map(v => v.id), selectedUnused)}
                                        />
                                        <span className="text-sm font-medium">Select All</span>
                                    </div>
                                    {selectedUnused.size > 0 && (
                                        <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={isProcessing}>
                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                            Delete ({selectedUnused.size})
                                        </Button>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    {unusedVendors.map(vendor => (
                                        <div key={vendor.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                                            <Checkbox
                                                checked={selectedUnused.has(vendor.id)}
                                                onCheckedChange={() => toggleSelection(setSelectedUnused, vendor.id)}
                                            />
                                            <span className="font-medium cursor-pointer" onClick={() => toggleSelection(setSelectedUnused, vendor.id)}>{vendor.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default VendorReconciliationDialog;
