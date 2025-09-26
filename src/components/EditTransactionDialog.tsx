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
import { Loader2, Trash2 } from "lucide-react";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { Transaction } from "@/data/finance-data";
import ConfirmationDialog from "./ConfirmationDialog";

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: Transaction | null;
}

const formSchema = z.object({
  date: z.string().min(1, "Date is required."),
  account: z.string().min(1, "Account is required."),
  vendor: z.string().min(1, "Vendor/Payee is required."),
  category: z.string().min(1, "Category is required."),
  amount: z.coerce.number().refine(val => val !== 0, { message: "Amount cannot be zero." }),
  remarks: z.string().optional(),
});

type TransactionFormData = z.infer<typeof formSchema>;

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  transaction,
}) => {
  const { updateTransaction, deleteTransaction, accountCurrencyMap, categories: allCategories, accounts, vendors, isLoadingAccounts, isLoadingVendors, isLoadingCategories } = useTransactions();
  const { convertBetweenCurrencies } = useCurrency();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const allPayees = React.useMemo(() => {
    return [
      ...accounts.map(p => ({ value: p.name, label: p.name, isAccount: true })),
      ...vendors.map(p => ({ value: p.name, label: p.name, isAccount: false }))
    ].sort((a, b) => a.label.localeCompare(b.label));
  }, [accounts, vendors]);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: "",
      account: "",
      vendor: "",
      category: "",
      amount: 0,
      remarks: "",
    },
  });

  React.useEffect(() => {
    if (transaction) {
      form.reset({
        date: formatDateToYYYYMMDD(transaction.date),
        account: transaction.account,
        vendor: transaction.vendor,
        category: transaction.category,
        amount: transaction.amount,
        remarks: transaction.remarks || "",
      });
    }
  }, [transaction, form]);

  const watchedVendor = form.watch("vendor");
  const isVendorAnAccount = React.useMemo(() => {
    return allPayees.find(p => p.value === watchedVendor)?.isAccount || false;
  }, [watchedVendor, allPayees]);

  React.useEffect(() => {
    if (isVendorAnAccount) {
      form.setValue("category", "Transfer", { shouldValidate: true });
    } else if (form.getValues("category") === "Transfer" && transaction?.category !== 'Transfer') {
      // Only reset if the original wasn't a transfer
      form.setValue("category", "", { shouldValidate: true });
    }
  }, [isVendorAnAccount, form, transaction]);

  const handleSubmit = async (data: TransactionFormData) => {
    if (!transaction) return;
    setIsSubmitting(true);
    try {
      await updateTransaction({
        ...transaction,
        ...data,
        date: new Date(data.date).toISOString(),
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in updateTransaction
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!transaction) return;
    setIsSubmitting(true);
    try {
      deleteTransaction(transaction.id, transaction.transfer_id);
      onOpenChange(false);
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      // Error handled in deleteTransaction
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the details of your transaction.
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
              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Are you sure?"
        description="This will permanently delete the transaction. If this is part of a transfer, both sides of the transfer will be deleted. This action cannot be undone."
        confirmText="Delete"
      />
    </>
  );
};