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
import { useTransactions } from "@/contexts/TransactionsContext"; // Import useTransactions
import ConfirmationDialog from "./ConfirmationDialog";
import { Trash2, Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client";
import { getAccountCurrency } from "@/integrations/supabase/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import LoadingOverlay from "./LoadingOverlay";
import { useUser } from "@/contexts/UserContext"; // Import useUser

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
  const { updateTransaction, deleteTransaction, accountCurrencyMap, categories: allCategories } = useTransactions(); // Get allCategories from context
  const { currencySymbols, convertBetweenCurrencies } = useCurrency();
  const { user } = useUser(); // Get user from UserContext
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [allAccounts, setAllAccounts] = React.useState<string[]>([]);
  const [allVendors, setAllVendors] = React.useState<string[]>([]);
  const [accountCurrencySymbol, setAccountCurrencySymbol] = React.useState<string>('$');
  const [destinationAccountCurrency, setDestinationAccountCurrency] = React.useState<string | null>(null);
  const [displayReceivingAmount, setDisplayReceivingAmount] = React.useState<number>(0);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...transaction,
      date: formatDateToYYYYMMDD(transaction.date),
    },
  });

  const fetchPayees = React.useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.from('vendors').select('name, is_account').eq('user_id', user.id); // Filter by user_id
    if (error) {
      console.error("Error fetching payees:", error.message);
      return;
    }
    const accounts = data.filter(p => p.is_account).map(p => p.name);
    const vendors = data.filter(p => !p.is_account).map(p => p.name);
    setAllAccounts(accounts);
    setAllVendors(vendors);
  }, [user?.id]);

  React.useEffect(() => {
    if (isOpen) {
      fetchPayees();
      form.reset({
        ...transaction,
        date: formatDateToYYYYMMDD(transaction.date),
      });
      setIsSaving(false);
    }
  }, [transaction, form, isOpen, fetchPayees]);

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const amountValue = form.watch("amount");
  const isTransfer = allAccounts.includes(vendorValue);

  React.useEffect(() => {
    const updateCurrencySymbol = async () => {
      if (accountValue && user?.id) {
        const currencyCode = accountCurrencyMap.get(accountValue) || await getAccountCurrency(accountValue, user.id);
        setAccountCurrencySymbol(currencySymbols[currencyCode] || currencyCode);
      } else {
        setAccountCurrencySymbol('$');
      }
    };
    updateCurrencySymbol();
  }, [accountValue, currencySymbols, isOpen, accountCurrencyMap, user?.id]);

  React.useEffect(() => {
    const fetchDestinationCurrency = async () => {
      if (isTransfer && vendorValue && user?.id) {
        const currencyCode = accountCurrencyMap.get(vendorValue) || await getAccountCurrency(vendorValue, user.id);
        setDestinationAccountCurrency(currencyCode);
      } else {
        setDestinationAccountCurrency(null);
      }
    };
    fetchDestinationCurrency();
  }, [vendorValue, isTransfer, accountCurrencyMap, user?.id]);


  React.useEffect(() => {
    if (isTransfer) {
      form.setValue("category", "Transfer");
    } else if (form.getValues("category") === "Transfer") {
      form.setValue("category", "");
    }
  }, [isTransfer, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      await updateTransaction({
        ...transaction,
        ...values,
        date: new Date(values.date).toISOString(),
        currency: accountCurrencyMap.get(values.account) || transaction.currency,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id, transaction.transfer_id);
    onOpenChange(false);
  };

  const baseAccountOptions = allAccounts.map(acc => ({ value: acc, label: acc }));
  const baseVendorOptions = allVendors.map(v => ({ value: v, label: v }));

  const filteredAccountOptions = baseAccountOptions.map(option => ({
    ...option,
    disabled: option.value === vendorValue && allAccounts.includes(vendorValue),
  }));

  const combinedBaseVendorOptions = [...baseAccountOptions, ...baseVendorOptions];

  const filteredCombinedVendorOptions = combinedBaseVendorOptions.map(option => ({
    ...option,
    disabled: option.value === accountValue,
  }));

  // Filter out 'Transfer' category from options, ensure 'Others' is always present
  const categoryOptions = allCategories
    .filter(c => c.name !== 'Transfer')
    .map(cat => ({ value: cat.name, label: cat.name }));

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
                  disabled={isSaving}
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