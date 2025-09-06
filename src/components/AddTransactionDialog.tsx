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
import { categories } from "@/data/finance-data"; // Removed 'accounts' and 'vendors'
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client"; // Import supabase

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
  const [allAccounts, setAllAccounts] = React.useState<string[]>([]);
  const [allVendors, setAllVendors] = React.useState<string[]>([]);

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
        date: new Date().toISOString().split("T")[0],
        account: "",
        vendor: "",
        category: "",
        amount: 0,
        remarks: "",
      });
    }
  }, [isOpen, form, fetchPayees]);

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const isTransfer = allAccounts.includes(vendorValue); // Check against dynamically fetched accounts

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