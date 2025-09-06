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
import { Trash2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client";
import { getAccountCurrency } from "@/integrations/supabase/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatDateToYYYYMMDD } from "@/lib/utils"; // Import formatDateToYYYYMMDD

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  account: z.string().min(1, "Account is required"),
  vendor: z.string().min(1, "Vendor is required"),
  amount: z.coerce.number(),
  remarks: z.string().optional(),
  category: z.string().min(1, "Category is required"),
}).refine(data => data.account !== data.vendor, {
  message: "Source and destination accounts cannot be the same.",
  path: ["vendor"],
});

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: Transaction;
}

const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  transaction,
}) => {
  const { updateTransaction, deleteTransaction, accountCurrencyMap } = useTransactions();
  const { currencySymbols, convertBetweenCurrencies } = useCurrency();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [allAccounts, setAllAccounts] = React.useState<string[]>([]);
  const [allVendors, setAllVendors] = React.useState<string[]>([]);
  const [accountCurrencySymbol, setAccountCurrencySymbol] = React.useState<string>('$');
  const [destinationAccountCurrency, setDestinationAccountCurrency] = React.useState<string | null>(null);
  const [displayReceivingAmount, setDisplayReceivingAmount] = React.useState<number>(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...transaction,
      date: formatDateToYYYYMMDD(transaction.date), // Format for input type="date"
    },
  });

  const fetchPayees = React.useCallback(async () => {
    const { data, error } = await supabase.from('vendors').select('name, is_account');
    if (error) {
      console.error("Error fetching payees:", error.message);
      return;
    }
    const accounts = data.filter(p => p.is_account).map(p => p.name);
    const vendors = data.filter(p => !p.is_account).map(p => p.name);
    setAllAccounts(accounts);
    setAllVendors(vendors);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      fetchPayees();
      form.reset({
        ...transaction,
        date: formatDateToYYYYMMDD(transaction.date), // Format for input type="date"
      });
    }
  }, [transaction, form, isOpen, fetchPayees]);

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const amountValue = form.watch("amount");
  const isTransfer = allAccounts.includes(vendorValue);

  // Effect to update currency symbol for sending account when account changes or dialog opens
  React.useEffect(() => {
    const updateCurrencySymbol = async () => {
      if (accountValue) {
        const currencyCode = accountCurrencyMap.get(accountValue) || await getAccountCurrency(accountValue);
        setAccountCurrencySymbol(currencySymbols[currencyCode] || currencyCode);
      } else {
        setAccountCurrencySymbol('$');
      }
    };
    updateCurrencySymbol();
  }, [accountValue, currencySymbols, isOpen, accountCurrencyMap]);

  // Effect to fetch destination account currency when vendor changes (if it's an account)
  React.useEffect(() => {
    const fetchDestinationCurrency = async () => {
      if (isTransfer && vendorValue) {
        const currencyCode = await getAccountCurrency(vendorValue);
        setDestinationAccountCurrency(currencyCode);
      } else {
        setDestinationAccountCurrency(null);
      }
    };
    fetchDestinationCurrency();
  }, [vendorValue, isTransfer]);

  // Effect to calculate and display receiving amount for cross-currency transfers
  React.useEffect(() => {
    if (isTransfer && accountValue && vendorValue && destinationAccountCurrency) {
      const sourceCurrency = accountCurrencyMap.get(accountValue);
      if (sourceCurrency && sourceCurrency !== destinationAccountCurrency) {
        const convertedAmount = convertBetweenCurrencies(Math.abs(amountValue), sourceCurrency, destinationAccountCurrency);
        setDisplayReceivingAmount(convertedAmount);
      } else {
        setDisplayReceivingAmount(Math.abs(amountValue)); // Same currency, receiving amount is absolute sending amount
      }
    } else {
      setDisplayReceivingAmount(0);
    }
  }, [isTransfer, amountValue, accountValue, vendorValue, accountCurrencyMap, destinationAccountCurrency, convertBetweenCurrencies]);


  React.useEffect(() => {
    if (isTransfer) {
      form.setValue("category", "Transfer");
    } else if (form.getValues("category") === "Transfer") {
      // If it was a transfer but now isn't, clear category or set a default
      form.setValue("category", "");
    }
  }, [isTransfer, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateTransaction({
      ...transaction,
      ...values,
      date: new Date(values.date).toISOString(),
      currency: accountCurrencyMap.get(values.account) || transaction.currency, // Ensure currency is updated to current account currency
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id, transaction.transfer_id);
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

  const showReceivingValueField = isTransfer && accountValue && vendorValue && destinationAccountCurrency && (accountCurrencyMap.get(accountValue) !== destinationAccountCurrency);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
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
                        {categories.filter(c => c !== 'Transfer').map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                        {accountCurrencySymbol}
                      </span>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="pl-8" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showReceivingValueField && (
                <FormItem>
                  <FormLabel>Amount (Receiving)</FormLabel>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                      {currencySymbols[destinationAccountCurrency || 'USD'] || destinationAccountCurrency}
                    </span>
                    <FormControl>
                      <Input
                        type="number"
                        value={displayReceivingAmount.toFixed(2)}
                        readOnly
                        className="pl-8 bg-muted"
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    This is the estimated amount received in the destination account's currency.
                  </FormDescription>
                </FormItem>
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
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button type="submit">Save changes</Button>
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