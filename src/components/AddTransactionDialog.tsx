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
import { categories } from "@/data/finance-data";
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client";
import { getAccountCurrency } from "@/integrations/supabase/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatDateToYYYYMMDD } from "@/lib/utils"; // Import formatDateToYYYYMMDD

interface AddTransactionFormValues {
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  remarks?: string;
  receivingAmount?: number; // Added for editable receiving amount
}

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  account: z.string().min(1, "Account is required"),
  vendor: z.string().min(1, "Vendor is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().refine(val => val !== 0, { message: "Amount cannot be zero" }),
  remarks: z.string().optional(),
  receivingAmount: z.coerce.number().optional(), // Added for editable receiving amount
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
  const { addTransaction, accountCurrencyMap } = useTransactions();
  const { currencySymbols, convertBetweenCurrencies, formatCurrency } = useCurrency();
  const [allAccounts, setAllAccounts] = React.useState<string[]>([]);
  const [allVendors, setAllVendors] = React.useState<string[]>([]);
  const [accountCurrencySymbol, setAccountCurrencySymbol] = React.useState<string>('$');
  const [destinationAccountCurrency, setDestinationAccountCurrency] = React.useState<string | null>(null);
  const [autoCalculatedReceivingAmount, setAutoCalculatedReceivingAmount] = React.useState<number>(0); // Renamed for clarity

  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: formatDateToYYYYMMDD(new Date()), // Format for input type="date"
      account: "",
      vendor: "",
      category: "",
      amount: 0,
      remarks: "",
      receivingAmount: 0, // Initialize receivingAmount
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
        date: formatDateToYYYYMMDD(new Date()), // Format for input type="date"
        account: "",
        vendor: "",
        category: "",
        amount: 0,
        remarks: "",
        receivingAmount: 0, // Reset receivingAmount
      });
      setAccountCurrencySymbol('$'); // Reset currency symbol
      setDestinationAccountCurrency(null);
      setAutoCalculatedReceivingAmount(0);
    }
  }, [isOpen, form, fetchPayees]);

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const amountValue = form.watch("amount");
  const isTransfer = allAccounts.includes(vendorValue); // Check against dynamically fetched accounts

  // Effect to update currency symbol for sending account when account changes
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
  }, [accountValue, currencySymbols, accountCurrencyMap]);

  // Effect to fetch destination account currency when vendor changes (if it's an account)
  React.useEffect(() => {
    const fetchDestinationCurrency = async () => {
      if (isTransfer && vendorValue) {
        const currencyCode = accountCurrencyMap.get(vendorValue) || await getAccountCurrency(vendorValue);
        setDestinationAccountCurrency(currencyCode);
      } else {
        setDestinationAccountCurrency(null);
      }
    };
    fetchDestinationCurrency();
  }, [vendorValue, isTransfer, accountCurrencyMap]);

  // Effect to calculate autoCalculatedReceivingAmount for transfers with different currencies
  React.useEffect(() => {
    if (isTransfer && accountValue && vendorValue && destinationAccountCurrency) {
      const sendingCurrency = accountCurrencyMap.get(accountValue);
      if (sendingCurrency && sendingCurrency !== destinationAccountCurrency) {
        const convertedAmount = convertBetweenCurrencies(
          Math.abs(amountValue), // Always use absolute value for conversion display
          sendingCurrency,
          destinationAccountCurrency
        );
        setAutoCalculatedReceivingAmount(convertedAmount);
        // Set the form field value to the auto-calculated amount as a suggestion
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
      // If it was a transfer but now isn't, clear category or set a default
      form.setValue("category", "");
    }
  }, [isTransfer, form]);

  const onSubmit = (values: AddTransactionFormValues) => {
    addTransaction(values);
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
                          value={field.value === 0 ? "" : field.value} // Display empty string for 0
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                          placeholder={autoCalculatedReceivingAmount.toFixed(2)} // Show auto-calculated as placeholder
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