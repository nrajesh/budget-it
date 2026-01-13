import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/contexts/TransactionsContext";
import { ensurePayeeExists } from "@/integrations/supabase/utils";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Check, Plus, Loader2, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

interface AccountReconciliationDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const AccountReconciliationDialog = ({
    isOpen,
    onClose,
}: AccountReconciliationDialogProps) => {
    const { transactions, accounts, refetchAccounts, addTransaction, refetchTransactions } = useTransactions();
    const { formatCurrency } = useCurrency();
    const { toast } = useToast();

    // Missing Accounts (for creation)
    const [missingAccounts, setMissingAccounts] = useState<string[]>([]);

    // Unused Accounts (for deletion)
    const [unusedAccounts, setUnusedAccounts] = useState<{ id: string; name: string }[]>([]);

    const [accountBalances, setAccountBalances] = useState<
        { name: string; systemBalance: number; currency: string; actualBalance: string }[]
    >([]);

    const [selectedMissing, setSelectedMissing] = useState<Set<string>>(new Set());
    const [selectedUnused, setSelectedUnused] = useState<Set<string>>(new Set());

    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Calculate missing accounts and balances when open
    useEffect(() => {
        if (isOpen) {
            calculateData();
            setSelectedMissing(new Set());
            setSelectedUnused(new Set());
        }
    }, [isOpen, transactions, accounts]);

    const calculateData = () => {
        const transactionAccounts = new Set(transactions.map((t) => t.account).filter(Boolean));
        const systemAccountNames = new Set(accounts.map((a) => a.name));

        // Missing
        const missing = Array.from(transactionAccounts).filter(
            (name) => !systemAccountNames.has(name)
        );
        setMissingAccounts(missing);

        // Unused
        const unused = accounts.filter(a => {
            if (a.name === 'Others') return false;
            return !transactionAccounts.has(a.name);
        }).map(a => ({ id: a.id, name: a.name }));
        setUnusedAccounts(unused);

        // Balances
        const balances = accounts.map((acc) => ({
            name: acc.name,
            systemBalance: acc.running_balance || 0,
            currency: acc.currency || 'USD',
            actualBalance: "",
        }));
        setAccountBalances(balances);
    };

    const createAccount = async (name: string) => {
        // Find a transaction to guess currency?
        const txn = transactions.find(t => t.account === name);
        const currency = txn?.currency || 'USD';
        await ensurePayeeExists(name, true, { currency });
    };

    const deleteAccount = async (id: string) => {
        // Direct delete via Supabase
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) throw error;
    };

    const handleCreateAccount = async (name: string) => {
        try {
            await createAccount(name);
            toast({ title: "Account Created", description: `Created account: ${name}` });

            await refetchAccounts();
            setMissingAccounts(prev => prev.filter(acc => acc !== name));
            setSelectedMissing(prev => {
                const next = new Set(prev);
                next.delete(name);
                return next;
            });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const handleBulkCreate = async () => {
        if (selectedMissing.size === 0) return;
        setIsCreating(true);
        try {
            const accountsToCreate = Array.from(selectedMissing);
            await Promise.all(accountsToCreate.map(name => createAccount(name)));

            toast({ title: "Accounts Created", description: `Successfully created ${accountsToCreate.length} accounts.` });

            await refetchAccounts();
            const createdSet = new Set(accountsToCreate);
            setMissingAccounts(prev => prev.filter(acc => !createdSet.has(acc)));
            setSelectedMissing(new Set());
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUnused.size === 0) return;
        setIsDeleting(true);
        try {
            const accountsToDeleteIds = Array.from(selectedUnused);
            await Promise.all(accountsToDeleteIds.map(id => deleteAccount(id)));

            toast({ title: "Accounts Deleted", description: `Successfully deleted ${accountsToDeleteIds.length} unused accounts.` });

            await refetchAccounts();
            // Refetching accounts will update the unused list via useEffect if we trigger it, 
            // but the useEffect depends on `accounts` which refetch will update.
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReconcile = async (accountName: string, systemBalance: number, actualBalanceStr: string, currency: string) => {
        const actualBalance = parseFloat(actualBalanceStr);
        if (isNaN(actualBalance)) {
            toast({ title: "Invalid Amount", description: "Please enter a valid number", variant: "destructive" });
            return;
        }

        const diff = actualBalance - systemBalance;
        if (Math.abs(diff) < 0.01) {
            toast({ title: "Balanced", description: "Account is already balanced." });
            return;
        }

        try {
            const adjustmentCategory = "Adjustment";
            await addTransaction({
                date: new Date().toISOString(),
                account: accountName,
                vendor: "System Adjustment", // Payee
                category: adjustmentCategory,
                amount: diff,
                remarks: "Reconciliation adjustment",
                is_scheduled_origin: false,
            });

            toast({ title: "Reconciled", description: `Adjustment transaction of ${formatCurrency(diff, currency)} created.` });

            setAccountBalances(prev => prev.map(a => a.name === accountName ? { ...a, actualBalance: "" } : a));
            await refetchTransactions();
            await refetchAccounts();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
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
                    <DialogTitle>Reconcile Accounts</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="missing" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="missing">Missing</TabsTrigger>
                        <TabsTrigger value="unused">Unused</TabsTrigger>
                        <TabsTrigger value="balance">Balance Check</TabsTrigger>
                    </TabsList>

                    <TabsContent value="missing" className="flex-1 overflow-y-auto p-4 border rounded-md mt-2">
                        {missingAccounts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Check className="h-8 w-8 mb-2" />
                                <p>All transaction accounts exist in the system.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4 p-2 bg-muted/40 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={missingAccounts.length > 0 && selectedMissing.size === missingAccounts.length}
                                            onCheckedChange={() => toggleSelectAll(setSelectedMissing, missingAccounts, selectedMissing)}
                                        />
                                        <label className="text-sm font-medium cursor-pointer">
                                            Select All
                                        </label>
                                    </div>
                                    {selectedMissing.size > 0 && (
                                        <Button size="sm" onClick={handleBulkCreate} disabled={isCreating}>
                                            {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                            Create Selected ({selectedMissing.size})
                                        </Button>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    {missingAccounts.map(name => (
                                        <div key={name} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={selectedMissing.has(name)}
                                                    onCheckedChange={() => toggleSelection(setSelectedMissing, name)}
                                                />
                                                <span className="font-medium cursor-pointer" onClick={() => toggleSelection(setSelectedMissing, name)}>{name}</span>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => handleCreateAccount(name)}>
                                                <Plus className="h-4 w-4 mr-1" /> Create
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="unused" className="flex-1 overflow-y-auto p-4 border rounded-md mt-2">
                        {unusedAccounts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Check className="h-8 w-8 mb-2" />
                                <p>No unused accounts found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4 p-2 bg-muted/40 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={unusedAccounts.length > 0 && selectedUnused.size === unusedAccounts.length}
                                            onCheckedChange={() => toggleSelectAll(setSelectedUnused, unusedAccounts.map(a => a.id), selectedUnused)}
                                        />
                                        <label className="text-sm font-medium cursor-pointer">
                                            Select All
                                        </label>
                                    </div>
                                    {selectedUnused.size > 0 && (
                                        <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={isDeleting}>
                                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                            Delete Selected ({selectedUnused.size})
                                        </Button>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    {unusedAccounts.map(acc => (
                                        <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={selectedUnused.has(acc.id)}
                                                    onCheckedChange={() => toggleSelection(setSelectedUnused, acc.id)}
                                                />
                                                <span className="font-medium cursor-pointer" onClick={() => toggleSelection(setSelectedUnused, acc.id)}>{acc.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="balance" className="flex-1 overflow-y-auto p-4 border rounded-md mt-2">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Enter the *actual* balance from your bank. We'll create an adjustment transaction for the difference.
                            </p>
                            <div className="grid gap-2">
                                {accountBalances.map((acc, idx) => (
                                    <div key={acc.name} className="flex items-center justify-between p-3 border rounded-lg bg-card gap-4">
                                        <div className="w-1/3">
                                            <div className="font-medium truncate" title={acc.name}>{acc.name}</div>
                                            <div className="text-xs text-muted-foreground">System: {formatCurrency(acc.systemBalance, acc.currency)}</div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-1">
                                            <Input
                                                placeholder="Actual Balance"
                                                type="number"
                                                step="0.01"
                                                value={acc.actualBalance}
                                                onChange={(e) => {
                                                    const newVal = e.target.value;
                                                    setAccountBalances(prev => {
                                                        const next = [...prev];
                                                        next[idx] = { ...next[idx], actualBalance: newVal };
                                                        return next;
                                                    });
                                                }}
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            disabled={!acc.actualBalance}
                                            onClick={() => handleReconcile(acc.name, acc.systemBalance, acc.actualBalance, acc.currency)}
                                        >
                                            Reconcile
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

            </DialogContent>
        </Dialog>
    );
};

export default AccountReconciliationDialog;
