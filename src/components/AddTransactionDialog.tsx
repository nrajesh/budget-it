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
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/hooks/useCurrency"; // Import useCurrency
import { format } from "date-fns";
import { toast } from "sonner";

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

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const {
    addTransaction,
    accountCurrencyMap,
    categories: allCategories,
    accounts,
    vendors,
    isLoadingAccounts,
    isLoadingVendors,
    isLoadingCategories,
  } = useTransactions();
  const { currencySymbols, convertBetweenCurrencies, formatCurrency } = useCurrency();

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
    if (!isOpen) {
      form.reset({
        date: new Date(),
        account: "",
        vendor: "",
        category: "",
        amount: 0,
        remarks: "",
      });
    }
  }, [isOpen, form]);

  const allAccounts = React.useMemo(() => accounts?.map((p) => p.name) || [], [accounts]);
  const allVendors = React.useMemo(() => vendors?.map((p) => p.name) || [], [vendors]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const transactionData = {
        date: format(values.date, "yyyy-MM-dd"),
        account: values.account,
        vendor: values.vendor || null,
        category: values.category,
        amount: values.amount,
        remarks: values.remarks || null,
        currency: accountCurrencyMap[values.account] || "USD", // Default to USD if not found
      };
      await addTransaction(transactionData);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add transaction.");
      console.error("Add transaction error:", error);
    }
  };

  const categoryOptions = React.useMemo(() =>
    allCategories?.filter((c) => c.name !== "Transfer").map((cat) => ({ value: cat.name, label: cat.name })) || [],
    [allCategories]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
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
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Add Transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};