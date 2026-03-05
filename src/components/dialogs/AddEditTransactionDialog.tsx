import * as React from "react";
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
import { Loader2 } from "lucide-react";
import { useAIConfig } from "@/hooks/useAIConfig";
import { useAutoCategorize } from "@/hooks/useAutoCategorize";
import { showError, showSuccess } from "@/utils/toast";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecurrenceUpdateDialog } from "./RecurrenceUpdateDialog";
import {
  useTransactionFormLogic,
  AddEditTransactionFormValues,
} from "./hooks/useTransactionFormLogic";

interface AddEditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: (accountName?: string) => void;
  transactionToEdit?: Record<string, unknown> | null;
}

const AddEditTransactionDialog: React.FC<AddEditTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  transactionToEdit,
}) => {
  const {
    addTransaction,
    updateTransaction,
    updateScheduledTransaction,
    scheduledTransactions,
    categories: allCategories,
    vendors,
    isLoadingAccounts,
    isLoadingVendors,
    isLoadingCategories,
    allSubCategories,
    subCategories,
    accountCurrencyMap,
    transactions: allTransactions,
  } = useTransactions();
  const { currencySymbols, formatCurrency } = useCurrency();

  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = React.useState(false);
  const [pendingValues, setPendingValues] =
    React.useState<AddEditTransactionFormValues | null>(null);

  const { toast } = useToast();

  // Use the custom hook for form logic
  const {
    form,
    transactionType,
    setTransactionType,
    isTransfer,
    accountCurrencySymbol,
    activeAccountCurrencyCode,
    destinationAccountCurrency,
    autoCalculatedReceivingAmount,
    allAccounts,
  } = useTransactionFormLogic({ transactionToEdit, isOpen });

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const recurrenceFrequency = form.watch("recurrenceFrequency");

  const { config } = useAIConfig();
  const { autoCategorize, getHistoricalMapping } = useAutoCategorize();
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  const handleAutoCategorize = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!vendorValue) return;

    // 1. Try resolving locally first to save tokens
    const sortedHistory = [...allTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const cached = getHistoricalMapping(vendorValue, sortedHistory);

    if (cached) {
      let updated = false;
      if (cached.categoryName) {
        form.setValue("category", cached.categoryName, {
          shouldValidate: true,
        });
        updated = true;
      }
      if (cached.subCategoryName) {
        form.setValue("sub_category", cached.subCategoryName, {
          shouldValidate: true,
        });
        updated = true;
      }

      if (updated) {
        toast({
          title: "Categorized from History",
          description: `Automatically mapped to ${cached.categoryName}`,
        });
        return; // Break early so we don't hit the AI
      }
    }

    // 2. Pre-flight check before pinging AI
    if (!config.apiKey || config.provider === "NONE") {
      toast({
        title: "AI Not Configured",
        description: (
          <div className="flex flex-col gap-2">
            <span>Please configure your AI provider and API key first.</span>
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="w-fit mt-1"
            >
              <Link to="/settings" onClick={() => onOpenChange(false)}>
                Go to AI Settings
              </Link>
            </Button>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    // 3. Fallback to pinging the AI if not found locally
    setIsAiLoading(true);
    try {
      const result = await autoCategorize(
        vendorValue,
        allCategories,
        subCategories,
      );

      let updated = false;
      if (result.categoryName) {
        form.setValue("category", result.categoryName, {
          shouldValidate: true,
        });
        updated = true;
      }
      if (result.subCategoryName) {
        form.setValue("sub_category", result.subCategoryName, {
          shouldValidate: true,
        });
        updated = true;
      }

      if (updated) {
        showSuccess("Categorized magically! ✨");
      } else {
        showError("AI couldn't map to a category.");
      }
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || "Auto-categorize failed";
      toast({
        title: "Categorization Failed",
        description: (
          <div className="flex flex-col gap-2">
            <span>{errorMessage}</span>
            {errorMessage.includes("configured") && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-fit mt-1"
              >
                <Link to="/settings" onClick={() => onOpenChange(false)}>
                  Go to AI Settings
                </Link>
              </Button>
            )}
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTransactionSave = async (
    values: AddEditTransactionFormValues,
    updateFuture: boolean = false,
  ) => {
    const finalAmount =
      transactionType === "expense"
        ? -Math.abs(values.amount)
        : Math.abs(values.amount);

    const transactionData = {
      ...transactionToEdit,
      date: values.date,
      account: values.account,
      vendor: values.vendor,
      category: values.category || "",
      sub_category: values.sub_category,
      amount: finalAmount,
      remarks: values.remarks,
      receivingAmount: values.receivingAmount,
      recurrence_frequency: values.recurrenceFrequency,
      recurrence_end_date: values.recurrenceEndDate,
      currency: activeAccountCurrencyCode,
    };

    if (transactionToEdit) {
      // @ts-expect-error - overriding properties makes TS think id is missing
      await updateTransaction(transactionData);

      if (updateFuture && transactionToEdit.recurrence_id) {
        // Find original schedule to keep its ID and Date
        const originalSchedule = scheduledTransactions.find(
          (s) => s.id === transactionToEdit.recurrence_id,
        );
        if (originalSchedule) {
          await updateScheduledTransaction({
            ...originalSchedule,
            account: values.account,
            vendor: values.vendor,
            category: values.category || "",
            sub_category: values.sub_category || null,
            amount: values.amount,
            remarks: values.remarks || null,
            frequency: values.recurrenceFrequency as
              | "None"
              | "Daily"
              | "Weekly"
              | "Monthly"
              | "Quarterly"
              | "Yearly",
            end_date: values.recurrenceEndDate || null,
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

  const allVendors = React.useMemo(() => vendors.map((p) => p.name), [vendors]);
  const baseAccountOptions = React.useMemo(
    () => allAccounts.map((acc) => ({ value: acc, label: acc })),
    [allAccounts],
  );
  const baseVendorOptions = React.useMemo(
    () => allVendors.map((v) => ({ value: v, label: v })),
    [allVendors],
  );

  const filteredAccountOptions = React.useMemo(
    () =>
      baseAccountOptions.map((option) => ({
        ...option,
        disabled:
          option.value === vendorValue && allAccounts.includes(vendorValue),
      })),
    [baseAccountOptions, vendorValue, allAccounts],
  );

  const combinedBaseVendorOptions = React.useMemo(
    () =>
      [...baseAccountOptions, ...baseVendorOptions].sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    [baseAccountOptions, baseVendorOptions],
  );

  const filteredCombinedVendorOptions = React.useMemo(
    () =>
      combinedBaseVendorOptions.map((option) => ({
        ...option,
        disabled: option.value === accountValue,
      })),
    [combinedBaseVendorOptions, accountValue],
  );

  const categoryOptions = React.useMemo(
    () =>
      allCategories
        .filter((c) => c.name !== "Transfer")
        .map((cat) => ({ value: cat.name, label: cat.name })),
    [allCategories],
  );
  const subCategoryOptions = React.useMemo(
    () => allSubCategories.map((sub) => ({ value: sub, label: sub })),
    [allSubCategories],
  );

  const showReceivingValueField =
    isTransfer &&
    accountValue &&
    vendorValue &&
    destinationAccountCurrency &&
    accountCurrencyMap.get(accountValue) !== destinationAccountCurrency;

  const isFormLoading =
    isLoadingAccounts || isLoadingVendors || isLoadingCategories;
  const isEditMode = !!transactionToEdit;

  React.useEffect(() => {
    if (isOpen) {
      setRecurrenceDialogOpen(false);
      setPendingValues(null);
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Transaction" : "Add New Transaction"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Modify the details of this transaction."
                : "Quickly add a new transaction to your records."}
            </DialogDescription>
          </DialogHeader>
          {isFormLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, (errors) =>
                  console.error("Form Validation Errors:", errors),
                )}
                className="grid grid-cols-2 gap-4"
              >
                <div className="col-span-2 flex justify-center mb-4">
                  <Tabs
                    value={transactionType}
                    onValueChange={(v) =>
                      !isTransfer &&
                      setTransactionType(v as "expense" | "income")
                    }
                    className="w-[400px]"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="expense">Expense</TabsTrigger>
                      <TabsTrigger value="income" disabled={isTransfer}>
                        Income
                      </TabsTrigger>
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
                        <Input type="date" className="text-sm" {...field} />
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
                      {!isTransfer &&
                        field.value &&
                        config.provider !== "NONE" && (
                          <div className="flex justify-end mt-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={handleAutoCategorize}
                              disabled={isAiLoading}
                            >
                              {isAiLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                "✨ "
                              )}
                              Auto-Categorize
                            </Button>
                          </div>
                        )}
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
                        value={field.value || ""}
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
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            placeholder="0.00"
                            className="pl-8"
                          />
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
                            {currencySymbols[
                              destinationAccountCurrency || "USD"
                            ] || destinationAccountCurrency}
                          </span>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? 0
                                    : parseFloat(e.target.value),
                                )
                              }
                              placeholder={autoCalculatedReceivingAmount.toFixed(
                                2,
                              )}
                              className="pl-8"
                            />
                          </FormControl>
                        </div>
                        <FormDescription>
                          This is the amount received in the destination
                          account's currency. Auto-calculated:{" "}
                          {formatCurrency(
                            autoCalculatedReceivingAmount,
                            destinationAccountCurrency || "USD",
                          )}
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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

                {recurrenceFrequency && recurrenceFrequency !== "None" && (
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
                          The date after which this transaction will no longer
                          recur.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter className="col-span-2">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditMode ? "Save Changes" : "Add Transaction"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <RecurrenceUpdateDialog
        isOpen={recurrenceDialogOpen}
        onOpenChange={setRecurrenceDialogOpen}
        actionType="edit"
        count={1}
        onConfirm={(mode) => {
          if (pendingValues) {
            handleTransactionSave(pendingValues, mode === "future");
          }
        }}
      />
    </>
  );
};

export default AddEditTransactionDialog;
