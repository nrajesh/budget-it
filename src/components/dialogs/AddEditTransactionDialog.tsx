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
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLedger } from "@/contexts/LedgerContext";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { useDataProvider } from '@/context/DataProviderContext';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecurrenceUpdateDialog } from "./RecurrenceUpdateDialog";

interface AddEditTransactionFormValues {
  date: string;
  account: string;
  vendor: string;
  category: string;
  sub_category?: string;
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
  sub_category: z.string().optional(),
  amount: z.coerce.number().refine(val => val !== 0, { message: "Amount cannot be zero" }),
  remarks: z.string().optional(),
  receivingAmount: z.coerce.number().optional(),
  recurrenceFrequency: z.string().optional(),
  recurrenceEndDate: z.string().optional(),
}).refine(data => data.account !== data.vendor, {
  message: "Source and destination accounts cannot be the same.",
  path: ["vendor"],
});

interface AddEditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: (accountName?: string) => void;
  transactionToEdit?: any;
}

const AddEditTransactionDialog: React.FC<AddEditTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  transactionToEdit,
}) => {
  // ... existing code ...
  const { addTransaction, updateTransaction, updateScheduledTransaction, scheduledTransactions, accountCurrencyMap, categories: allCategories, accounts, vendors, isLoadingAccounts, isLoadingVendors, isLoadingCategories, allSubCategories } = useTransactions();
  const { currencySymbols, convertBetweenCurrencies, formatCurrency, selectedCurrency } = useCurrency();
  const { activeLedger } = useLedger();
  const dataProvider = useDataProvider();

  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<AddEditTransactionFormValues | null>(null);
  const [transactionType, setTransactionType] = React.useState<'expense' | 'income'>('expense');

  // ... existing hooks ...
  const allAccounts = React.useMemo(() => accounts.map(p => p.name), [accounts]);
  const allVendors = React.useMemo(() => vendors.map(p => p.name), [vendors]);

  const [accountCurrencySymbol, setAccountCurrencySymbol] = React.useState<string>(currencySymbols[selectedCurrency] || selectedCurrency);
  const [activeAccountCurrencyCode, setActiveAccountCurrencyCode] = React.useState<string>(selectedCurrency);
  const [destinationAccountCurrency, setDestinationAccountCurrency] = React.useState<string | null>(null);
  const [autoCalculatedReceivingAmount, setAutoCalculatedReceivingAmount] = React.useState<number>(0);

  const form = useForm<AddEditTransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: formatDateToYYYYMMDD(new Date()),
      account: "",
      vendor: "",
      category: "",
      sub_category: "",
      amount: 0,
      remarks: "",
      receivingAmount: 0,
      recurrenceFrequency: "None",
      recurrenceEndDate: "",
    },
  });
  const { setValue, getValues, reset } = form;

  // ... useEffects ...

  React.useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        reset({
          date: transactionToEdit.date ? formatDateToYYYYMMDD(new Date(transactionToEdit.date)) : formatDateToYYYYMMDD(new Date()),
          account: transactionToEdit.account || "",
          vendor: transactionToEdit.vendor || "",
          category: transactionToEdit.category || "",
          sub_category: transactionToEdit.sub_category || "",
          amount: Math.abs(transactionToEdit.amount || 0),
          remarks: transactionToEdit.remarks || "",
          receivingAmount: transactionToEdit.receivingAmount || 0,
          recurrenceFrequency: transactionToEdit.recurrence_frequency || "None",
          recurrenceEndDate: transactionToEdit.recurrence_end_date ? formatDateToYYYYMMDD(new Date(transactionToEdit.recurrence_end_date)) : "",
        });
        setTransactionType(transactionToEdit.amount >= 0 ? 'income' : 'expense');
      } else {
        reset({
          date: formatDateToYYYYMMDD(new Date()),
          account: "",
          vendor: "",
          category: "",
          sub_category: "",
          amount: 0,
          remarks: "",
          receivingAmount: 0,
          recurrenceFrequency: "None",
          recurrenceEndDate: "",
        });
        setTransactionType('expense');
      }
      setAccountCurrencySymbol(currencySymbols[selectedCurrency] || selectedCurrency);
      setDestinationAccountCurrency(null);
      setAutoCalculatedReceivingAmount(0);
      setRecurrenceDialogOpen(false);
      setPendingValues(null);
    }
  }, [isOpen, reset, transactionToEdit]);

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const amountValue = form.watch("amount");
  const recurrenceFrequency = form.watch("recurrenceFrequency");

  const isTransfer = React.useMemo(() => allAccounts.includes(vendorValue), [allAccounts, vendorValue]);

  // ... currency logic ...
  React.useEffect(() => {
    const updateCurrencySymbol = async () => {
      if (accountValue) {
        const currencyCode = accountCurrencyMap.get(accountValue) || await dataProvider.getAccountCurrency(accountValue, activeLedger?.id || '');
        setAccountCurrencySymbol(currencySymbols[currencyCode] || currencyCode);
        setActiveAccountCurrencyCode(currencyCode);
      } else {
        setAccountCurrencySymbol(currencySymbols[selectedCurrency] || selectedCurrency);
        setActiveAccountCurrencyCode(selectedCurrency);
      }
    };
    updateCurrencySymbol();
  }, [accountValue, currencySymbols, accountCurrencyMap, dataProvider]);

  React.useEffect(() => {
    const fetchDestinationCurrency = async () => {
      if (isTransfer && vendorValue) {
        const currencyCode = accountCurrencyMap.get(vendorValue) || await dataProvider.getAccountCurrency(vendorValue, activeLedger?.id || '');
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
      if (getValues("category") !== "Transfer") {
        setValue("category", "Transfer");
      }
    } else if (getValues("category") === "Transfer") {
      setValue("category", "");
    }
  }, [isTransfer, setValue, getValues]);

  const handleTransactionSave = async (values: AddEditTransactionFormValues, updateFuture: boolean = false) => {
    const finalAmount = transactionType === 'expense' ? -Math.abs(values.amount) : Math.abs(values.amount);

    const transactionData = {
      ...transactionToEdit,
      date: values.date,
      account: values.account,
      vendor: values.vendor,
      category: values.category,
      sub_category: values.sub_category,
      amount: finalAmount,
      remarks: values.remarks,
      receivingAmount: values.receivingAmount,
      recurrence_frequency: values.recurrenceFrequency,
      recurrence_end_date: values.recurrenceEndDate,
      currency: activeAccountCurrencyCode,
    };

    if (transactionToEdit) {
      await updateTransaction(transactionData);

      if (updateFuture && transactionToEdit.recurrence_id) {
        // Find original schedule to keep its ID and Date
        const originalSchedule = scheduledTransactions.find(s => s.id === transactionToEdit.recurrence_id);
        if (originalSchedule) {
          await updateScheduledTransaction({
            ...originalSchedule,
            account: values.account,
            vendor: values.vendor,
            category: values.category,
            sub_category: values.sub_category || null,
            amount: values.amount,
            remarks: values.remarks || null,
            frequency: values.recurrenceFrequency as any,
            end_date: values.recurrenceEndDate || null,
            // We do NOT update 'date' (next run date) based on transaction edit, 
            // as editing a past occurrence shouldn't necessarily shift the future schedule anchor.
            // Unless we want to support that? For now, stick to updating details.
          });
        }
      }

    } else {
      await addTransaction(transactionData);
    }

    if (onSuccess) {
      onSuccess(values.account);
    }
    onOpenChange(false);
  };

  const onSubmit = async (values: AddEditTransactionFormValues) => {
    if (transactionToEdit && transactionToEdit.recurrence_id) {
      setPendingValues(values);
      setRecurrenceDialogOpen(true);
    } else {
      await handleTransactionSave(values, false);
    }
  };

  const baseAccountOptions = React.useMemo(() => allAccounts.map(acc => ({ value: acc, label: acc })), [allAccounts]);
  const baseVendorOptions = React.useMemo(() => allVendors.map(v => ({ value: v, label: v })), [allVendors]);

  const filteredAccountOptions = React.useMemo(() => baseAccountOptions.map(option => ({
    ...option,
    disabled: option.value === vendorValue && allAccounts.includes(vendorValue),
  })), [baseAccountOptions, vendorValue, allAccounts]);

  const combinedBaseVendorOptions = React.useMemo(() => [...baseAccountOptions, ...baseVendorOptions].sort((a, b) => a.label.localeCompare(b.label)), [baseAccountOptions, baseVendorOptions]);

  const filteredCombinedVendorOptions = React.useMemo(() => combinedBaseVendorOptions.map(option => ({
    ...option,
    disabled: option.value === accountValue,
  })), [combinedBaseVendorOptions, accountValue]);

  const categoryOptions = React.useMemo(() => allCategories.filter(c => c.name !== 'Transfer').map(cat => ({ value: cat.name, label: cat.name })), [allCategories]);
  const subCategoryOptions = React.useMemo(() => allSubCategories.map(sub => ({ value: sub, label: sub })), [allSubCategories]);

  const showReceivingValueField = isTransfer && accountValue && vendorValue && destinationAccountCurrency && (accountCurrencyMap.get(accountValue) !== destinationAccountCurrency);

  const isFormLoading = isLoadingAccounts || isLoadingVendors || isLoadingCategories;

  const isEditMode = !!transactionToEdit;

  React.useEffect(() => {
    if (isTransfer) {
      setTransactionType('expense');
    }
  }, [isTransfer]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Modify the details of this transaction." : "Quickly add a new transaction to your records."}
            </DialogDescription>
          </DialogHeader>
          {isFormLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("Form Validation Errors:", errors))} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex justify-center mb-4">
                  <Tabs value={transactionType} onValueChange={(v) => !isTransfer && setTransactionType(v as 'expense' | 'income')} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="expense">Expense</TabsTrigger>
                      <TabsTrigger value="income" disabled={isTransfer}>Income</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
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
                        onCreate={(value) => field.onChange(value)}
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
                        onCreate={(value) => field.onChange(value)}
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
                        onCreate={(value) => field.onChange(value)}
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
                  name="sub_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-category</FormLabel>
                      <Combobox
                        options={subCategoryOptions}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onCreate={(value) => field.onChange(value)}
                        placeholder="Select or create..."
                        searchPlaceholder="Search sub-categories..."
                        emptyPlaceholder="No sub-category found."
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
                    <FormItem className="col-span-2">
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

                <DialogFooter className="col-span-2">
                  <Button type="submit">{isEditMode ? "Save Changes" : "Add Transaction"}</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dynamic import of RecurrenceUpdateDialog to avoid circular deps if any but standard import is fine */}
      <RecurrenceUpdateDialog
        isOpen={recurrenceDialogOpen}
        onOpenChange={setRecurrenceDialogOpen}
        actionType="edit"
        count={1}
        onConfirm={(mode) => {
          if (pendingValues) {
            handleTransactionSave(pendingValues, mode === 'future');
          }
        }}
      />
    </>
  );
};

export default AddEditTransactionDialog;