import * as React from "react";
import { useForm, Controller } from "react-hook-form";
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
import { useTransactions } from "@/contexts/TransactionsContext";
import { accounts, vendors, categories } from "@/data/finance-data";
import { Combobox } from "@/components/ui/combobox";

// Define the interface for the form values
interface AddTransactionFormValues {
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  remarks?: string; // Optional
}

// Let Zod infer the type of formSchema
const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  account: z.string().min(1, "Account is required"),
  vendor: z.string().min(1, "Vendor is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number(),
  remarks: z.string().optional(),
});

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { addTransaction } = useTransactions();
  // Use AddTransactionFormValues for useForm generic type
  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      account: "",
      vendor: "",
      category: "",
      amount: 0,
      remarks: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        date: new Date().toISOString().split("T")[0],
        account: "",
        vendor: "",
        category: "",
        amount: 0,
        remarks: "",
      });
    }
  }, [isOpen, form]);

  // The values here will now be of type AddTransactionFormValues
  const onSubmit = (values: AddTransactionFormValues) => {
    addTransaction(values);
    onOpenChange(false);
  };

  const accountOptions = accounts.map(acc => ({ value: acc, label: acc }));
  const vendorOptions = vendors.map(v => ({ value: v, label: v }));
  const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));

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
                  <FormLabel>Account</FormLabel>
                  <Combobox
                    options={accountOptions}
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
                  <FormLabel>Vendor</FormLabel>
                   <Combobox
                    options={vendorOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select a vendor..."
                    searchPlaceholder="Search vendors..."
                    emptyPlaceholder="No vendor found."
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