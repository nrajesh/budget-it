"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { useTransactions, Transaction } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  account: z.string({ required_error: "Account is required." }),
  vendor: z.string().optional(),
  category: z.string({ required_error: "Category is required." }),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive({ message: "Amount must be positive." })
  ),
  remarks: z.string().optional(),
});

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  transaction,
}) => {
  const {
    updateTransaction,
    deleteTransaction,
    accountCurrencyMap,
    categories: allCategories,
    accounts,
    vendors,
    isLoadingAccounts,
    isLoadingVendors,
    isLoadingCategories,
  } = useTransactions();
  const { currencySymbols, convertBetweenCurrencies } = useCurrency();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      account: "",
      vendor: "",
      category: "",
      amount: 0,
      remarks: "",
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        date: new Date(transaction.date),
        account: transaction.account,
        vendor: transaction.vendor || "",
        category: transaction.category,
        amount: transaction.amount,
        remarks: transaction.remarks || "",
      });
    } else {
      form.reset({
        date: new Date(),
        account: "",
        vendor: "",
        category: "",
        amount: 0,
        remarks: "",
      });
    }
  }, [transaction, isOpen, form]);

  const allAccounts = React.useMemo(() => accounts?.map((p) => p.name) || [], [accounts]);
  const allVendors = React.useMemo(() => vendors?.map((p) => p.name) || [], [vendors]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!transaction) return;
    try {
      const transactionData = {
        id: transaction.id,
        date: format(values.date, "yyyy-MM-dd"),
        account: values.account,
        vendor: values.vendor || null,
        category: values.category,
        amount: values.amount,
        remarks: values.remarks || null,
        currency: accountCurrencyMap[values.account] || "USD",
      };
      await updateTransaction(transactionData);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update transaction.");
      console.error("Update transaction error:", error);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    try {
      await deleteTransaction(transaction.id);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete transaction.");
      console.error("Delete transaction error:", error);
    }
  };

  const categoryOptions = allCategories?.filter((c) => c.name !== "Transfer").map((cat) => ({ value: cat.name, label: cat.name })) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Date</FormLabel>
                  <FormControl className="col-span-3">
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl className="col-span-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingAccounts ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        allAccounts.map((acc) => (
                          <SelectItem key={acc} value={acc}>
                            {acc}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4 col-start-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Vendor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl className="col-span-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingVendors ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        allVendors.map((ven) => (
                          <SelectItem key={ven} value={ven}>
                            {ven}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4 col-start-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl className="col-span-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        categoryOptions.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4 col-start-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Amount</FormLabel>
                  <FormControl className="col-span-3">
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Remarks</FormLabel>
                  <FormControl className="col-span-3">
                    <Textarea placeholder="Optional remarks" {...field} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-2" />
                </FormItem>
              )}
            />
            <DialogFooter className="flex justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      this transaction and remove its data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};