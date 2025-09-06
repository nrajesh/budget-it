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
  FormDescription,
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
import { Trash2, Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client";
import { getAccountCurrency } from "@/integrations/supabase/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import LoadingOverlay from "./LoadingOverlay";

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  account: z.string().min(1, "Account is required"),
  vendor: z.string().min(1, "Vendor is required"),
  amount: z.coerce.number(),
  remarks: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  receivingAmount: z.coerce.number().optional().nullable(),
}).refine(data => data.account !== data.vendor, {
  message: "Source and destination accounts cannot be the same.",
  path: ["vendor"],
});

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: Transaction;
  onUpdateSuccess: () => void;
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
  const [isSaving, setIsSaving] = React.useState(false);
  const [debitTxId, setDebitTxId] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const resetFormAndState = React.useCallback(async () => {
    setIsSaving(false);
    const isCurrentTransactionTransfer = !!transaction.transfer_id;
    setIsTransfer(isCurrentTransactionTransfer);

    // Fetch all payees
    const { data, error } = await supabase.from('vendors').select('name, is_account');
    if (error) {
      console.error("Error fetching payees:", error.message);
      return;
    }
    const accounts = data.filter(p => p.is_account).map(p => p.name);
    const vendors = data.filter(p => !p.is_account).map(p => p.name);
    setAllAccounts(accounts);
    setAllVendors(vendors);

    if (isCurrentTransactionTransfer) {
      const linkedTransaction = allTransactions.find(t => t.transfer_id === transaction.transfer_id && t.id !== transaction.id);
      if (!linkedTransaction) {
        console.error("Could not find linked transaction.");
        onOpenChange(false);
        return;
      }

      const debitTx = transaction.amount < 0 ? transaction : linkedTransaction;
      const creditTx = transaction.amount > 0 ? transaction : linkedTransaction;

      setDebitTxId(debitTx.id);

      const sendingAccount = debitTx.account;
      const receivingAccount = creditTx.account;

      const sendingCurrency = await getAccountCurrency(sendingAccount);
      const receivingCurrency = await getAccountCurrency(receivingAccount);

      setSendingAccountCurrencyCode(sendingCurrency);
      setReceivingAccountCurrencyCode(receivingCurrency);
      const sameCurrency = sendingCurrency === receivingCurrency;
      setIsSameCurrencyTransfer(sameCurrency);

      form.reset({
        date: formatDateToYYYYMMDD(debitTx.date),
        account: sendingAccount,
        vendor: receivingAccount,
        amount: Math.abs(debitTx.amount),
        category: 'Transfer',
        remarks: debitTx.remarks || '',
        receivingAmount: sameCurrency ? null : Math.abs(creditTx.amount),
      });

    } else {
      // Handle non-transfer transaction
      const accountCurrency = await getAccountCurrency(transaction.account);
      setSendingAccountCurrencyCode(accountCurrency);
      setReceivingAccountCurrencyCode(null);
      setIsSameCurrencyTransfer(false);
      setDebitTxId(null);
      form.reset({
        ...transaction,
        date: formatDateToYYYYMMDD(transaction.date),
        receivingAmount: null,
      });
    }
  }, [transaction, allTransactions, onOpenChange, form, accountCurrencyMap]);

  React.useEffect(() => {
    if (isOpen) {
      resetFormAndState();
    }
  }, [transaction, isOpen, resetFormAndState]);

  const amountValue = form.watch("amount");

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
    setIsSaving(true);
    try {
      const payload = {
        ...transaction,
        ...values,
        date: new Date(values.date).toISOString(),
        amount: isTransfer ? -Math.abs(values.amount) : values.amount,
        currency: sendingAccountCurrencyCode,
        category: isTransfer ? 'Transfer' : values.category,
        id: isTransfer ? debitTxId! : transaction.id,
      };

      await updateTransaction(
        payload,
        isTransfer && !isSameCurrencyTransfer ? values.receivingAmount : undefined
      );

      onUpdateSuccess();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id, transaction.transfer_id);
    onUpdateSuccess();
    onOpenChange(false);
  };

  const baseAccountOptions = allAccounts.map(acc => ({ value: acc, label: acc }));
  const baseVendorOptions = allVendors.map(v => ({ value: v, label: v }));
  const combinedBaseVendorOptions = [...baseAccountOptions, ...baseVendorOptions];
  const categoryOptions = categories.filter(c => c !== 'Transfer').map(cat => ({ value: cat, label: cat }));
  const showReceivingValueField = isTransfer && !isSameCurrencyTransfer;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <LoadingOverlay isLoading={isSaving} message="Saving changes..." />
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="date" render={({ field }) => ( <FormItem> <FormLabel>Date</FormLabel> <FormControl> <Input type="date" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="account" render={({ field }) => ( <FormItem> <FormLabel>From Account</FormLabel> <Combobox options={baseAccountOptions} value={field.value} onChange={field.onChange} placeholder="Select an account" searchPlaceholder="Search accounts..." emptyPlaceholder="No account found." /> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="vendor" render={({ field }) => ( <FormItem> <FormLabel>{isTransfer ? 'To Account' : 'Vendor'}</FormLabel> <Combobox options={combinedBaseVendorOptions} value={field.value} onChange={field.onChange} placeholder="Select a vendor or account" searchPlaceholder="Search..." emptyPlaceholder="No results found." /> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="category" render={({ field }) => ( <FormItem> <FormLabel>Category</FormLabel> <Select onValueChange={field.onChange} value={field.value} disabled={isTransfer}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select a category" /> </SelectTrigger> </FormControl> <SelectContent> {categoryOptions.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)} </SelectContent> </Select> {isTransfer && <FormDescription>Category is fixed for transfers.</FormDescription>} <FormMessage /> </FormItem> )} />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ({isTransfer ? 'Sending' : 'Transaction'})</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                          {currencySymbols[sendingAccountCurrencyCode] || sendingAccountCurrencyCode}
                        </span>
                        <Input type="number" step="0.01" {...field} className="pl-8" />
                      </div>
                    </FormControl>
                    {isTransfer && isSameCurrencyTransfer && ( <FormDescription> This amount will also update the linked transfer transaction. </FormDescription> )}
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
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                            {currencySymbols[receivingAccountCurrencyCode || 'USD'] || receivingAccountCurrencyCode}
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                            placeholder={autoCalculatedReceivingAmount.toFixed(2)}
                            className="pl-8"
                          />
                        </div>
                      </FormControl>
                      <FormDescription> Auto-calculated: {formatCurrency(autoCalculatedReceivingAmount, receivingAccountCurrencyCode || 'USD')} </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField control={form.control} name="remarks" render={({ field }) => ( <FormItem> <FormLabel>Remarks</FormLabel> <FormControl> <Input {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
              <DialogFooter className="sm:justify-between pt-4">
                <Button type="button" variant="destructive" onClick={() => setIsDeleteConfirmOpen(true)} disabled={isSaving}> <Trash2 className="mr-2 h-4 w-4" /> Delete </Button>
                <Button type="submit" disabled={isSaving}> {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog isOpen={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen} onConfirm={handleDelete} title="Are you sure you want to delete this transaction?" description={ transaction.transfer_id ? "This is a transfer. Deleting it will remove both the debit and credit entries. This action cannot be undone." : "This action cannot be undone. This will permanently delete the transaction." } confirmText="Delete" />
    </>
  );
};

export default EditTransactionDialog;