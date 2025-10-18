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
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { useTransactions, Budget } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path
import { format } from "date-fns";
import { toast } from "sonner";

const formSchema = z.object({
  category_id: z.string({ required_error: "Category is required." }),
  target_amount: z.preprocess(
    (val) => Number(val),
    z.number().positive({ message: "Target amount must be positive." })
  ),
  currency: z.string({ required_error: "Currency is required." }),
  start_date: z.date({ required_error: "Start date is required." }),
  end_date: z.date().optional(),
  frequency: z.string({ required_error: "Frequency is required." }),
  is_active: z.boolean().default(true),
});

interface AddEditBudgetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget;
  onSave: (data: any) => Promise<void>;
  isSaving: boolean;
}

export const AddEditBudgetDialog: React.FC<AddEditBudgetDialogProps> = ({
  isOpen,
  onOpenChange,
  budget,
  onSave,
  isSaving,
}) => {
  const { categories, isLoadingCategories } = useTransactions();
  const { availableCurrencies } = useCurrency();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: "",
      target_amount: 0,
      currency: "USD",
      start_date: new Date(),
      end_date: undefined,
      frequency: "monthly",
      is_active: true,
    },
  });

  useEffect(() => {
    if (budget) {
      form.reset({
        category_id: budget.category_id,
        target_amount: budget.target_amount,
        currency: budget.currency,
        start_date: new Date(budget.start_date),
        end_date: budget.end_date ? new Date(budget.end_date) : undefined,
        frequency: budget.frequency,
        is_active: budget.is_active,
      });
    } else {
      form.reset({
        category_id: "",
        target_amount: 0,
        currency: "USD",
        start_date: new Date(),
        end_date: undefined,
        frequency: "monthly",
        is_active: true,
      });
    }
  }, [budget, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const budgetData = {
        ...values,
        start_date: format(values.start_date, "yyyy-MM-dd"),
        end_date: values.end_date ? format(values.end_date, "yyyy-MM-dd") : null,
      };
      await onSave(budgetData);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save budget.");
      console.error("Budget save error:", error);
    }
  };

  const title = budget ? "Edit Budget" : "Add New Budget";

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
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
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
                        categories?.filter((c) => c.name !== "Transfer").map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="target_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCurrencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active Budget</FormLabel>
                    <FormDescription>
                      Whether this budget is currently active.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {budget ? "Save Changes" : "Add Budget"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};