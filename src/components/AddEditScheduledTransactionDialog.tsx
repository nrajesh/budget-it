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
import { ScheduledTransaction, Payee, Category } from "@/contexts/TransactionsContext"; // Import types
import { format } from "date-fns";
import { toast } from "sonner";

const formSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  account: z.string({ required_error: "Account is required." }),
  vendor: z.string({ required_error: "Vendor is required." }),
  category: z.string({ required_error: "Category is required." }),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive({ message: "Amount must be positive." })
  ),
  frequency: z.string({ required_error: "Frequency is required." }),
  recurrence_end_date: z.date().optional().nullable(),
  remarks: z.string().optional(),
});

interface AddEditScheduledTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  scheduledTransaction?: ScheduledTransaction;
  onSave: (data: Partial<ScheduledTransaction>) => Promise<void>;
  isSubmitting: boolean;
  accounts: Payee[];
  allPayees: { value: string; label: string; isAccount: boolean }[];
  categories: Category[];
  isLoading: boolean;
}

export const AddEditScheduledTransactionDialog: React.FC<AddEditScheduledTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  scheduledTransaction,
  onSave,
  isSubmitting,
  accounts,
  allPayees,
  categories,
  isLoading,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      account: "",
      vendor: "",
      category: "",
      amount: 0,
      frequency: "monthly",
      recurrence_end_date: null,
      remarks: "",
    },
  });

  useEffect(() => {
    if (scheduledTransaction) {
      form.reset({
        date: new Date(scheduledTransaction.date),
        account: scheduledTransaction.account,
        vendor: scheduledTransaction.vendor,
        category: scheduledTransaction.category,
        amount: scheduledTransaction.amount,
        frequency: scheduledTransaction.frequency,
        recurrence_end_date: scheduledTransaction.recurrence_end_date ? new Date(scheduledTransaction.recurrence_end_date) : null,
        remarks: scheduledTransaction.remarks || "",
      });
    } else {
      form.reset({
        date: new Date(),
        account: "",
        vendor: "",
        category: "",
        amount: 0,
        frequency: "monthly",
        recurrence_end_date: null,
        remarks: "",
      });
    }
  }, [scheduledTransaction, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const transactionData = {
        id: scheduledTransaction?.id,
        date: format(values.date, "yyyy-MM-dd"),
        account: values.account,
        vendor: values.vendor,
        category: values.category,
        amount: values.amount,
        frequency: values.frequency,
        recurrence_end_date: values.recurrence_end_date ? format(values.recurrence_end_date, "yyyy-MM-dd") : null,
        remarks: values.remarks || null,
      };
      await onSave(transactionData);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save scheduled transaction.");
      console.error("Scheduled transaction save error:", error);
    }
  };

  const title = scheduledTransaction ? "Edit Scheduled Transaction" : "Add New Scheduled Transaction";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Start Date</FormLabel>
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
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.name}>
                            {acc.name}
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
                  <FormLabel className="text-right">Payee/Vendor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl className="col-span-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payee/vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        allPayees.map((payee) => (
                          <SelectItem key={payee.value} value={payee.value}>
                            {payee.label}
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
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
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
              name="frequency"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl className="col-span-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4 col-start-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recurrence_end_date"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">End Date (Optional)</FormLabel>
                  <FormControl className="col-span-3">
                    <DatePicker date={field.value || undefined} setDate={field.onChange} />
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
              <Button type="submit" disabled={isSubmitting}>
                {scheduledTransaction ? "Save Changes" : "Add Scheduled Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};