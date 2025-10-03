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
import { getAccountCurrency } from "@/integrations/supabase/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { Loader2 } from 'lucide-react'; // Import Loader2
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddTransactionFormValues {
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  remarks?: string;
  receivingAmount?: number;
  recurrenceFrequency?: string;
  recurrenceEndDate?: string;
}

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  account: z.string().min(1, "Account is required"),
  vendor: z.string().min(1, "Vendor is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().refine(val => val !== 0, { message: "Amount cannot be zero" }),
  remarks: z.string().optional(),
  receivingAmount: z.coerce.number().optional(),
  recurrenceFrequency: z.string().optional(),
  recurrenceEndDate: z.string().optional(),
}).refine(data => data.account !== data.vendor, {
  message: "Source and destination accounts cannot be the same.",
  path: ["vendor"],
}).refine(data => {
  if (data.recurrenceFrequency && data.recurrenceFrequency !== 'None') {
    return data.recurrenceEndDate !== undefined && data.recurrenceEndDate !== '';
  }
  return true;
}, {
  message: "End date is required when recurrence frequency is set",
  path: ["recurrenceEndDate"],
});

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { addTransaction, accountCurrencyMap, categories: allCategories, accounts, vendors, isLoadingAccounts, isLoadingVendors, isLoadingCategories } = useTransactions();
  const { currencySymbols, convertBetweenCurrencies, formatCurrency } = useCurrency();

  const allAccounts = React.useMemo(() => accounts.map(p => p.name), [accounts]);
  const allVendors = React.useMemo(() => vendors.map(p => p.name), [vendors]);

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
      recurrenceFrequency: "None",
      recurrenceEndDate: "",
    },
  });
  const { setValue, getValues, reset } = form;

  React.useEffect(() => {
    if (isOpen) {
      reset({
        date: formatDateToYYYYMMDD(new Date()),
        account: "",
        vendor: "",
        category: "",
        amount: 0,
        remarks: "",
        receivingAmount: 0,
        recurrenceFrequency: "None",
        recurrenceEndDate: "",
      });
      setAccountCurrencySymbol('$');
      setDestinationAccountCurrency(null);
      setAutoCalculatedReceivingAmount(0);
    }
  }, [isOpen, reset]);

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const amountValue = form.watch("amount");
  const recurrenceFrequency = form.watch("recurrenceFrequency");
  const isTransfer = allAccounts.includes(vendorValue);

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
        setValue("receivingAmount", parseFloat(convertedAmount.toFixed(2)));
      } else {
        setAutoCalculatedReceivingAmount(0);
        setValue("receivingAmount", 0);
      }
    } else {
      setAutoCalculatedReceivingAmount(0);
      setValue("receivingAmount", 0);
    }
  }, [amountValue, accountValue, vendorValue, isTransfer, accountCurrencyMap, destinationAccountCurrency, convertBetweenCurrencies, setValue]);

  React.useEffect(() => {
    if (isTransfer) {
      setValue("category", "Transfer");
    } else if (getValues("category") === "Transfer") {
      setValue("category", "");
    }
  }, [isTransfer, setValue, getValues]);

  const onSubmit = (values: AddTransactionFormValues) => {
    const transactionData = {
      date: values.date,
      account: values.account,
      vendor: values.vendor,
      category: values.category,
      amount: values.amount,
      remarks: values.remarks,
      receivingAmount: values.receivingAmount,
      recurrenceFrequency: values.recurrenceFrequency,
      recurrenceEndDate: values.recurrenceEndDate,
    };
    addTransaction(transactionData);
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

  const categoryOptions = allCategories.filter(c => c.name !== 'Transfer').map(cat => ({ value: cat.name, label: cat.name }));

  const showReceivingValueField = isTransfer && accountValue && vendorValue && destinationAccountCurrency && (accountCurrencyMap.get(accountValue) !== destinationAccountCurrency);

  const isFormLoading = isLoadingAccounts || isLoadingVendors || isLoadingCategories;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Quickly add a new transaction to your records.
          </DialogDescription>
        </DialogHeader>
        {isFormLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
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

              {/* Recurrence Fields */}
              <FormField
                control={form.control}
                name="recurrenceFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurrence Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recurrence frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set how often this transaction should repeat.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {recurrenceFrequency && recurrenceFrequency !== 'None' && (
                <FormField
                  control={form.control}
                  name="recurrenceEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        The date after which this transaction will no longer recur.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button type="submit">Add Transaction</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;