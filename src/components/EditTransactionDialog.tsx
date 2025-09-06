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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Transaction } from "@/data/finance-data";
import {
  Select, // Keep Select for category if not using Combobox there
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { accounts, vendors, categories } from "@/data/finance-data";
import { useTransactions } from "@/contexts/TransactionsContext";
import ConfirmationDialog from "./ConfirmationDialog";
import { Trash2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox"; // Import Combobox

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
  const { updateTransaction, deleteTransaction } = useTransactions();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...transaction,
      date: new Date(transaction.date).toISOString().split("T")[0],
    },
  });

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const isTransfer = accounts.includes(vendorValue);

  React.useEffect(() => {
    form.reset({
      ...transaction,
      date: new Date(transaction.date).toISOString().split("T")[0],
    });
  }, [transaction, form]);

  React.useEffect(() => {
    if (isTransfer) {
      form.setValue("category", "Transfer");
    }
  }, [isTransfer, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateTransaction({
      ...transaction,
      ...values,
      date: new Date(values.date).toISOString(),
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id, transaction.transfer_id); // Changed to transfer_id
    onOpenChange(false);
  };

  const baseAccountOptions = accounts.map(acc => ({ value: acc, label: acc }));
  const baseVendorOptions = vendors.map(v => ({ value: v, label: v }));

  // Filter account options: disable if it's the selected vendor (and vendor is an account)
  const filteredAccountOptions = baseAccountOptions.map(option => ({
    ...option,
    disabled: option.value === vendorValue && accounts.includes(vendorValue),
  }));

  // Combine vendor and account options for the vendor dropdown
  const combinedBaseVendorOptions = [...baseAccountOptions, ...baseVendorOptions];

  // Filter combined vendor options: disable if it's the selected account
  const filteredCombinedVendorOptions = combinedBaseVendorOptions.map(option => ({
    ...option,
    disabled: option.value === accountValue,
  }));

  const categoryOptions = categories.filter(c => c !== 'Transfer').map(cat => ({ value: cat, label: cat }));

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
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
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
          transaction.transfer_id // Changed to transfer_id
            ? "This is a transfer. Deleting it will remove both the debit and credit entries. This action cannot be undone."
            : "This action cannot be undone. This will permanently delete the transaction."
        }
        confirmText="Delete"
      />
    </>
  );
};

export default EditTransactionDialog;