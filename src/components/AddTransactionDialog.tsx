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
import { useTransactions } from "@/contexts/TransactionsContext";
import { accounts, categories } from "@/data/finance-data"; // Removed static vendors import
import { Combobox } from "@/components/ui/combobox";
import { useVendors } from "@/contexts/VendorsContext"; // Import useVendors

interface AddTransactionFormValues {
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  remarks?: string;
}

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  account: z.string().min(1, "Account is required"),
  vendor: z.string().min(1, "Vendor is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().refine(val => val !== 0, { message: "Amount cannot be zero" }),
  remarks: z.string().optional(),
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
  const { addTransaction } = useTransactions();
  const { vendors: dynamicVendors } = useVendors(); // Use dynamic vendors
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

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const isTransfer = accounts.includes(vendorValue);

  React.useEffect(() => {
    if (isTransfer) {
      form.setValue("category", "Transfer");
    }
  }, [isTransfer, form]);

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

  const onSubmit = (values: AddTransactionFormValues) => {
    addTransaction(values);
    onOpenChange(false);
  };

  const baseAccountOptions = accounts.map(acc => ({ value: acc, label: acc }));
  const dynamicVendorOptions = dynamicVendors.map(v => ({ value: v.name, label: v.name })); // Map dynamic vendors

  // Filter account options: disable if it's the selected vendor (and vendor is an account)
  const filteredAccountOptions = baseAccountOptions.map(option => ({
    ...option,
    disabled: option.value === vendorValue && accounts.includes(vendorValue),
  }));

  // Combine dynamic vendor and account options for the vendor dropdown
  const combinedBaseVendorOptions = [...baseAccountOptions, ...dynamicVendorOptions];

  // Filter combined vendor options: disable if it's the selected account
  const filteredCombinedVendorOptions = combinedBaseVendorOptions.map(option => ({
    ...option,
    disabled: option.value === accountValue,
  }));

  const categoryOptions = categories.filter(c => c !== 'Transfer').map(cat => ({ value: cat, label: cat }));

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
                  <FormLabel>Vendor / Destination Account</FormLabel>
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} placeholder="0.00" />
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