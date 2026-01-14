import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface AccountBalanceReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountBalanceReconciliationDialog: React.FC<AccountBalanceReconciliationDialogProps> = ({ isOpen, onClose }) => {
  const dataProvider = useDataProvider();
  const { accounts, transactions, invalidateAllData } = useTransactions();
  const { formatCurrency } = useCurrency();

  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [actualBalance, setActualBalance] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Calculate System Balance
  const systemBalance = React.useMemo(() => {
      if (!selectedAccount) return 0;
      // Filter transactions for this account
      // Note: This logic duplicates balance calc in hooks/BalanceOverTimeChart usually?
      // A simple sum of all transactions for this account.
      // Assuming 'amount' is positive for income, negative for expense.
      // Transfers: if account is source, amount is negative. If destination, amount is positive?
      // The Dexie schema stores 'amount'.
      // Usually, transactions for an account:
      // - Standard: amount is negative (expense) or positive (income).
      // - Transfer:
      //   - Debit: account=Source, amount=-X
      //   - Credit: account=Dest, vendor=Source, amount=+X
      // So simple sum should work if we filter by `account` field.

      const total = transactions
        .filter(t => t.account === selectedAccount.name)
        .reduce((sum, t) => sum + t.amount, 0);

      return (selectedAccount.starting_balance || 0) + total;
  }, [selectedAccount, transactions]);

  const difference = React.useMemo(() => {
      if (!actualBalance || isNaN(parseFloat(actualBalance))) return 0;
      return parseFloat(actualBalance) - systemBalance;
  }, [actualBalance, systemBalance]);

  const handleReconcile = async () => {
      if (!selectedAccount || difference === 0) return;
      setIsProcessing(true);
      try {
          // Create adjustment transaction
          await dataProvider.addTransaction({
              date: new Date().toISOString(),
              account: selectedAccount.name,
              vendor: "Balance Adjustment",
              category: "Adjustment", // Ensure this category exists or is created? 'ensureCategoryExists' handles it.
              amount: difference,
              remarks: `Reconciliation Adjustment to match balance ${actualBalance}`,
              currency: selectedAccount.currency || 'USD'
          });

          showSuccess("Balance reconciled successfully.");
          await invalidateAllData();
          onClose();
      } catch (error: any) {
          showError(`Reconciliation failed: ${error.message}`);
      } finally {
          setIsProcessing(false);
      }
  };

  useEffect(() => {
      if (isOpen) {
          setSelectedAccountId("");
          setActualBalance("");
      }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reconcile Account Balance</DialogTitle>
          <DialogDescription>
            Adjust the system balance to match your actual bank balance.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label>Select Account</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select account..." />
                    </SelectTrigger>
                    <SelectContent>
                        {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedAccount && (
                <>
                    <div className="flex justify-between items-center bg-muted p-3 rounded-md">
                        <span className="text-sm font-medium">System Balance:</span>
                        <span className="font-bold">{formatCurrency(systemBalance, selectedAccount.currency)}</span>
                    </div>

                    <div className="space-y-2">
                        <Label>Actual Balance</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={actualBalance}
                            onChange={(e) => setActualBalance(e.target.value)}
                            placeholder="Enter current bank balance"
                        />
                    </div>

                    {actualBalance && (
                        <div className={`text-sm text-right ${difference === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            Difference: {difference > 0 ? '+' : ''}{formatCurrency(difference, selectedAccount.currency)}
                        </div>
                    )}
                </>
            )}
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleReconcile} disabled={isProcessing || !selectedAccount || difference === 0}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Adjustment
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountBalanceReconciliationDialog;
