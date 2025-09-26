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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2 } from "lucide-react";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formSchema = z.object({
  date: z.string().min(1, "Date is required."),
  account: z.string().min(1, "Account is required."),
  vendor: z.string().min(1, "Vendor/Payee is required."),
  category: z.string().min(1, "Category is required."),
  amount: z.coerce.number().refine(val => val !== 0, { message: "Amount cannot be zero." }),
  remarks: z.string().optional(),
  isScheduled: z.boolean().default(false),
  recurrenceFrequency: z.string().optional(),
  recurrenceEndDate: z.string().optional(),
}).refine(data => {
  if (data.isScheduled) {
    return !!data.recurrenceFrequency;
  }
  return true;
}, {
  message: "Recurrence frequency is required for scheduled transactions.",
  path: ["recurrenceFrequency"],
});

type TransactionFormData = z.infer<typeof formSchema>;

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { addTransaction, accountCurrencyMap, categories: allCategories, accounts, vendors, isLoadingAccounts, isLoadingVendors, isLoadingCategories } = useTransactions();
  const { convertBetweenCurrencies, formatCurrency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [receivingAmount, setReceivingAmount] = React.useState<number | undefined>(undefined);

  const allPayees = React.useMemo(() => {
    return [
      ...accounts.map(p => ({ value: p.name, label: p.name, isAccount: true })),
      ...vendors.map(p => ({ value: p.name, label: p.name, isAccount: false }))
    ].sort((a, b) => a.label.localeCompare(b.label));
  }, [accounts, vendors]);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: formatDateToYYYYMMDD(new Date()),
      account: "",
      vendor: "",
      category: "",
      amount: 0,
      remarks: "",
      isScheduled: false,
      recurrenceFrequency: "1m",
    },
  });

  const watchedAccount = form.watch("account");
  const watchedVendor = form.watch("vendor");
  const watchedAmount = form.watch("amount");
  const isVendorAnAccount = React.useMemo(() => {
    return allPayees.find(p => p.value === watchedVendor)?.isAccount || false;
  }, [watchedVendor, allPayees]);

  React.useEffect(() => {
    if (isVendorAnAccount) {
      form.setValue("category", "Transfer", { shouldValidate: true });
    } else if (form.getValues("category") === "Transfer") {
      form.setValue("category", "", { shouldValidate: true });
    }
  }, [isVendorAnAccount, form]);

  React.useEffect(() => {
    if (isVendorAnAccount && watchedAccount && watchedVendor && watchedAmount) {
      const sourceCurrency = accountCurrencyMap.get(watchedAccount);
      const destCurrency = accountCurrencyMap.get(watchedVendor);
      if (sourceCurrency && destCurrency && sourceCurrency !== destCurrency) {
        const converted = convertBetweenCurrencies(Math.abs(watchedAmount), sourceCurrency, destCurrency);
        setReceivingAmount(converted);
      } else {
        setReceivingAmount(undefined);
      }
    } else {
      setReceivingAmount(undefined);
    }
  }, [watchedAccount, watchedVendor, watchedAmount, isVendorAnAccount, accountCurrencyMap, convertBetweenCurrencies]);

  const handleSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    try {
      await addTransaction({
        ...data,
        date: data.date, // Explicitly pass date to satisfy TypeScript
        receivingAmount: receivingAmount,
      });
      onOpenChange(false);
      form.reset({
        date: formatDateToYYYYMMDD(new Date()),
        account: "",
        vendor: "",
        category: "",
        amount: 0,
        remarks: "",
        isScheduled: false,
        recurrenceFrequency: "1m",
      });
    } catch (error) {
      // Error is already handled in addTransaction, but we catch here to stop the loading spinner
    } finally {
      setIsSubmitting(false);
    }
  };

  const isScheduled = form.watch("isScheduled");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your new transaction below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingAccounts}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor / Payee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingVendors || isLoadingAccounts}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor or account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allPayees.map(payee => (
                          <SelectItem key={payee.value} value={payee.value}>{payee.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={isVendorAnAccount || isLoadingCategories}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
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
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    {receivingAmount !== undefined && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Receiving amount: ~{formatCurrency(receivingAmount, accountCurrencyMap.get(watchedVendor))}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes about the transaction" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isScheduled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make this a scheduled transaction</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            {isScheduled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recurrenceFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1d">Daily</SelectItem>
                          <SelectItem value="1w">Weekly</SelectItem>
                          <SelectItem value="2w">Bi-weekly</SelectItem>
                          <SelectItem value="1m">Monthly</SelectItem>
                          <SelectItem value="3m">Quarterly</SelectItem>
                          <SelectItem value="1y">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recurrenceEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};