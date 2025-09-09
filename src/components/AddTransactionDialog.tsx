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
  DialogDescription,
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
import { useTransactions } from "@/contexts/TransactionsContext";
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client";
import { getAccountCurrency, ensurePayeeExists } from "@/integrations/supabase/utils"; // Import ensurePayeeExists
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext"; // Import useUser

interface AddTransactionFormValues {
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  remarks?: string;
  receivingAmount?: number;
}

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  account: z.string().min(1, "Account is required"),
  vendor: z.string().min(1, "Vendor is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().refine(val => val !== 0, { message: "Amount cannot be zero" }),
  remarks: z.string().optional(),
  receivingAmount: z.coerce.number().optional(),
}).refine(data => data.account !== data.vendor, {
  message: "Source and destination accounts cannot be the same.",
  path: ["vendor"],
});

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { addTransaction, accountCurrencyMap, categories: allCategories } = useTransactions(); // Get allCategories from context
  const { currencySymbols, convertBetweenCurrencies, formatCurrency } = useCurrency();
  const { user } = useUser(); // Get user from UserContext
  const [allAccounts, setAllAccounts] = React.useState<string[]>([]);
  const [allVendors, setAllVendors] = React.useState<string[]>([]);
  const [accountCurrencySymbol, setAccountCurrencySymbol] = React.useState<string>('$');
  const [destinationAccountCurrency, setDestinationAccountCurrency] = React.useState<string | null>(null);
  const [autoCalculatedReceivingAmount, setAutoCalculatedReceivingAmount] = React.useState<number>(0);

  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: formatDateToYYYYMMDD(new Date()),
      account: "",
      vendor: "",
      category: "",
      amount: 0,
      remarks: "",
      receivingAmount: 0,
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
        date: formatDateToYYYYMMDD(new Date()),
        account: "",
        vendor: "",
        category: "",
        amount: 0,
        remarks: "",
        receivingAmount: 0,
      });
      setAccountCurrencySymbol('$');
      setDestinationAccountCurrency(null);
      setAutoCalculatedReceivingAmount(0);
    }
  }, [isOpen, form, fetchPayees]);

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
  }, [accountValue, currencySymbols, accountCurrencyMap, user?.id]);

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
    if (isTransfer && accountValue && vendorValue && destinationAccountCurrency) {
      const sendingCurrency = accountCurrencyMap.get(accountValue);
      if (sendingCurrency && sendingCurrency !== destinationAccountCurrency) {
        const convertedAmount = convertBetweenCurrencies(
          Math.abs(amountValue),
          sendingCurrency,
          destinationAccountCurrency
        );
        setAutoCalculatedReceivingAmount(convertedAmount);
        form.setValue("receivingAmount", parseFloat(convertedAmount.toFixed(2)));
      } else {
        setAutoCalculatedReceivingAmount(0);
        form.setValue("receivingAmount", 0);
      }
    } else {
      setAutoCalculatedReceivingAmount(0);
      form.setValue("receivingAmount", 0);
    }
  }, [amountValue, accountValue, vendorValue, isTransfer, accountCurrencyMap, destinationAccountCurrency, convertBetweenCurrencies, form]);


  React.useEffect(() => {
    if (isTransfer) {
      form.setValue("category", "Transfer");
    } else if (form.getValues("category") === "Transfer") {
      form.setValue("category", "");
    }
  }, [isTransfer, form]);

  const onSubmit = (values: AddTransactionFormValues) => {
    addTransaction(values);
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

  const showReceivingValueField = isTransfer && accountValue && vendorValue && destinationAccountCurrency && (accountCurrencyMap.get(accountValue) !== destinationAccountCurrency);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Quickly add a new transaction to your records.
          </DialogDescription>
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
                  <FormLabel>Account (Sending)</FormLabel>
                  <Combobox
                    options={filteredAccountOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select an account..."
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
                  <FormLabel>Vendor / Account (Receiving)</FormLabel>
                   <Combobox
                    options={filteredCombinedVendorOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select a vendor or account..."
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
                   <Combobox
                    options={categoryOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select a category..."
                    searchPlaceholder="Search categories..."
                    emptyPlaceholder="No category found."
                    disabled={isTransfer}
                  />
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
                      <Input type="number" step="0.01" {...field} placeholder="0.00" className="pl-8" />
                    </FormControl>
                  </div>
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
                        {currencySymbols[destinationAccountCurrency || 'USD'] || destinationAccountCurrency}
                      </span>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                          placeholder={autoCalculatedReceivingAmount.toFixed(2)}
                          className="pl-8"
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      This is the amount received in the destination account's currency. Auto-calculated: {formatCurrency(autoCalculatedReceivingAmount, destinationAccountCurrency || 'USD')}
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
            <DialogFooter>
              <Button type="submit">Add Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;