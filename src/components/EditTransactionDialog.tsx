import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription, // Import FormDescription here
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Transaction } from "@/data/finance-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/data/finance-data";
import { useTransactions } from "@/contexts/TransactionsContext";
import ConfirmationDialog from "./ConfirmationDialog";
import { Trash2, Loader2 } from "lucide-react"; // Import Loader2
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client";
import { getAccountCurrency } from "@/integrations/supabase/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatDateToYYYYMMDD } from "@/lib/utils"; // Import formatDateToYYYYMMDD
import LoadingOverlay from "./LoadingOverlay"; // Import LoadingOverlay

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  account: z.string().min(1, "Account is required"),
  vendor: z.string().min(1, "Vendor is required"),
  amount: z.coerce.number(),
  remarks: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  receivingAmount: z.coerce.number().optional().nullable(), // Allow null for empty input
}).refine(data => data.account !== data.vendor, {
  message: "Source and destination accounts cannot be the same.",
  path: ["vendor"],
});

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: Transaction;
  onUpdateSuccess: () => void; // Added for refreshing parent table
}

const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  transaction,
  onUpdateSuccess,
}) => {
  const { updateTransaction, deleteTransaction, accountCurrencyMap, transactions: allTransactions } = useTransactions();
  const { currencySymbols, convertBetweenCurrencies, formatCurrency } = useCurrency();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [allAccounts, setAllAccounts] = React.useState<string[]>([]);
  const [allVendors, setAllVendors] = React.useState<string[]>([]);
  const [sendingAccountCurrencyCode, setSendingAccountCurrencyCode] = React.useState<string>('USD');
  const [receivingAccountCurrencyCode, setReceivingAccountCurrencyCode] = React.useState<string | null>(null);
  const [isSameCurrencyTransfer, setIsSameCurrencyTransfer] = React.useState(false);
  const [isTransfer, setIsTransfer] = React.useState(false);
  const [autoCalculatedReceivingAmount, setAutoCalculatedReceivingAmount] = React.useState<number>(0);
  const [isSaving, setIsSaving] = React.useState(false); // New state for loading overlay

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...transaction,
      date: formatDateToYYYYMMDD(transaction.date), // Format for input type="date"
      receivingAmount: null, // Initialize as null for empty input
    },
  });

  const fetchPayeesAndCurrencies = React.useCallback(async () => {
    const { data, error } = await supabase.from('vendors').select('name, is_account');
    if (error) {
      console.error("Error fetching payees:", error.message);
      return;
    }
    const accounts = data.filter(p => p.is_account).map(p => p.name);
    const vendors = data.filter(p => !p.is_account).map(p => p.name);
    setAllAccounts(accounts);
    setAllVendors(vendors);

    const currentSendingAccountCurrency = accountCurrencyMap.get(transaction.account) || await getAccountCurrency(transaction.account);
    setSendingAccountCurrencyCode(currentSendingAccountCurrency);

    const isCurrentTransactionTransfer = !!transaction.transfer_id;
    setIsTransfer(isCurrentTransactionTransfer);

    if (isCurrentTransactionTransfer) {
      const currentReceivingAccountCurrency = accountCurrencyMap.get(transaction.vendor) || await getAccountCurrency(transaction.vendor);
      setReceivingAccountCurrencyCode(currentReceivingAccountCurrency);
      const sameCurrency = currentSendingAccountCurrency === currentReceivingAccountCurrency;
      setIsSameCurrencyTransfer(sameCurrency);

      if (!sameCurrency) {
        // For cross-currency transfers, find the linked transaction to get its amount
        const linkedTransaction = allTransactions.find(t => t.transfer_id === transaction.transfer_id && t.id !== transaction.id);
        const initialReceivingAmount = linkedTransaction ? Math.abs(linkedTransaction.amount) : 0;

        const convertedAmount = convertBetweenCurrencies(
          Math.abs(transaction.amount),
          currentSendingAccountCurrency,
          currentReceivingAccountCurrency
        );
        setAutoCalculatedReceivingAmount(convertedAmount);
        // Set the form field value to the actual receiving amount from the linked transaction
        form.setValue("receivingAmount", parseFloat(initialReceivingAmount.toFixed(2)));
      } else {
        setAutoCalculatedReceivingAmount(0);
        form.setValue("receivingAmount", null); // Reset to null for same-currency transfers
      }
    } else {
      setReceivingAccountCurrencyCode(null);
      setIsSameCurrencyTransfer(false);
      setAutoCalculatedReceivingAmount(0);
      form.setValue("receivingAmount", null); // Reset to null for non-transfers
    }
  }, [transaction, accountCurrencyMap, convertBetweenCurrencies, form, allTransactions]);

  React.useEffect(() => {
    if (isOpen) {
      fetchPayeesAndCurrencies();
      form.reset({
        ...transaction,
        date: formatDateToYYYYMMDD(transaction.date), // Format for input type="date"
        receivingAmount: null, // Reset to null for empty input
      });
      setIsSaving(false); // Reset saving state when dialog opens
    }
  }, [transaction, form, isOpen, fetchPayeesAndCurrencies]);

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const amountValue = form.watch("amount");

  // Re-calculate auto-calculated receiving amount if sending amount changes in cross-currency transfer
  React.useEffect(() => {
    if (isTransfer && !isSameCurrencyTransfer && sendingAccountCurrencyCode && receivingAccountCurrencyCode) {
      const convertedAmount = convertBetweenCurrencies(
        Math.abs(amountValue),
        sendingAccountCurrencyCode,
        receivingAccountCurrencyCode
      );
      setAutoCalculatedReceivingAmount(convertedAmount);
    }
  }, [amountValue, isTransfer, isSameCurrencyTransfer, sendingAccountCurrencyCode, receivingAccountCurrencyCode, convertBetweenCurrencies]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true); // Start loading
    try {
      await updateTransaction(
        {
          ...transaction,
          ...values,
          date: new Date(values.date).toISOString(),
          currency: sendingAccountCurrencyCode, // Ensure currency is updated to current account currency
        },
        // Pass receivingAmount only for cross-currency transfers, and only if it's not null
        isTransfer && !isSameCurrencyTransfer && values.receivingAmount !== null
          ? values.receivingAmount
          : undefined
      );
      onUpdateSuccess(); // Notify parent component of success
      onOpenChange(false);
    } finally {
      setIsSaving(false); // End loading
    }
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id, transaction.transfer_id);
    onUpdateSuccess(); // Notify parent component of success
    onOpenChange(false);
  };

  const baseAccountOptions = allAccounts.map(acc => ({ value: acc, label: acc }));
  const baseVendorOptions = allVendors.map(v => ({ value: v, label: v }));

  // Filter account options: disable if it's the selected vendor (and vendor is an account)
  const filteredAccountOptions = baseAccountOptions.map(option => ({
    ...option,
    disabled: option.value === vendorValue && allAccounts.includes(vendorValue),
  }));

  // Combine vendor and account options for the vendor dropdown
  const combinedBaseVendorOptions = [...baseAccountOptions, ...baseVendorOptions];

  // Filter combined vendor options: disable if it's the selected account
  const filteredCombinedVendorOptions = combinedBaseVendorOptions.map(option => ({
    ...option,
    disabled: option.value === accountValue,
  }));

  const categoryOptions = categories.filter(c => c !== 'Transfer').map(cat => ({ value: cat, label: cat }));

  const showReceivingValueField = isTransfer && !isSameCurrencyTransfer;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <LoadingOverlay isLoading={isSaving} message="Saving changes..." /> {/* Loading overlay */}
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Combobox
                      options={filteredAccountOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select an account"
                      searchPlaceholder="Search accounts..."
                      emptyPlaceholder="No account found."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <Combobox
                      options={filteredCombinedVendorOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select a vendor or account"
                      searchPlaceholder="Search..."
                      emptyPlaceholder="No results found."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isTransfer}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {isTransfer && <FormDescription>Category is fixed as 'Transfer' for transfer transactions.</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (Sending)</FormLabel>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                        {currencySymbols[sendingAccountCurrencyCode] || sendingAccountCurrencyCode}
                      </span>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="pl-8" />
                      </FormControl>
                    </div>
                    {isTransfer && isSameCurrencyTransfer && (
                      <FormDescription>
                        This amount will also update the linked transfer transaction.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showReceivingValueField && (
                <FormField
                  control={form.control}
                  name="receivingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (Receiving)</FormLabel>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                          {currencySymbols[receivingAccountCurrencyCode || 'USD'] || receivingAccountCurrencyCode}
                        </span>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value === null ? "" : field.value} // Display empty string for null
                            onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                            placeholder={autoCalculatedReceivingAmount.toFixed(2)} // Always show auto-calculated as placeholder
                            className="pl-8"
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        This is the amount received in the destination account's currency. Auto-calculated: {formatCurrency(autoCalculatedReceivingAmount, receivingAccountCurrencyCode || 'USD')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
              />
              <DialogFooter className="sm:justify-between pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isSaving} // Disable delete button while saving
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Are you sure you want to delete this transaction?"
        description={
          transaction.transfer_id
            ? "This is a transfer. Deleting it will remove both the debit and credit entries. This action cannot be undone."
            : "This action cannot be undone. This will permanently delete the transaction."
        }
        confirmText="Delete"
      />
    </>
  );
};

export default EditTransactionDialog;