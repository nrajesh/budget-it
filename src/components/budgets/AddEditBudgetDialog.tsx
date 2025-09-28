import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/contexts/UserContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Budget } from "@/data/finance-data";

interface AddEditBudgetDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  budget: Budget | null;
  allBudgets: Budget[];
}

export const AddEditBudgetDialog: React.FC<AddEditBudgetDialogProps> = ({ isOpen, onOpenChange, budget, allBudgets }) => {
  const { user } = useUser();
  const { categories } = useTransactions();
  const { availableCurrencies, selectedCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formSchema = React.useMemo(() => z.object({
    category_id: z.string().min(1, "Category is required"),
    target_amount: z.coerce.number().positive("Target amount must be positive"),
    currency: z.string().min(1, "Currency is required"),
    start_date: z.string().min(1, "Start date is required"),
    frequency_value: z.coerce.number().min(1, "Frequency value must be at least 1"),
    frequency_unit: z.string().min(1, "Frequency unit is required"),
    end_date: z.string().optional(),
    is_active: z.boolean(),
  }).superRefine((data, ctx) => {
    if (!allBudgets) return;
    const frequency = `${data.frequency_value}${data.frequency_unit}`;
    const startDate = new Date(data.start_date).toLocaleDateString('en-CA'); // YYYY-MM-DD format

    const isDuplicate = allBudgets.some(b =>
      b.id !== budget?.id &&
      b.category_id === data.category_id &&
      b.frequency === frequency &&
      new Date(b.start_date).toLocaleDateString('en-CA') === startDate
    );

    if (isDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A budget with this category, frequency, and start date already exists.",
        path: ["category_id"],
      });
    }
  }), [allBudgets, budget]);

  type BudgetFormData = z.infer<typeof formSchema>;

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      is_active: true,
      currency: selectedCurrency,
      frequency_value: 1,
      frequency_unit: 'm',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (budget) {
        const frequencyMatch = budget.frequency.match(/^(\d+)([dwmy])$/);
        form.reset({
          category_id: budget.category_id,
          target_amount: budget.target_amount,
          currency: budget.currency,
          start_date: formatDateToYYYYMMDD(budget.start_date),
          frequency_value: frequencyMatch ? parseInt(frequencyMatch[1], 10) : 1,
          frequency_unit: frequencyMatch ? frequencyMatch[2] : 'm',
          end_date: budget.end_date ? formatDateToYYYYMMDD(budget.end_date) : "",
          is_active: budget.is_active,
        });
      } else {
        form.reset({
          category_id: "",
          target_amount: 0,
          currency: selectedCurrency,
          start_date: formatDateToYYYYMMDD(new Date()),
          frequency_value: 1,
          frequency_unit: 'm',
          end_date: "",
          is_active: true,
        });
      }
    }
  }, [isOpen, budget, form, selectedCurrency]);

  const onSubmit = async (values: BudgetFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    const frequency = `${values.frequency_value}${values.frequency_unit}`;
    const dbPayload = {
      user_id: user.id,
      category_id: values.category_id,
      target_amount: values.target_amount,
      currency: values.currency,
      start_date: new Date(values.start_date).toISOString(),
      frequency,
      end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
      is_active: values.is_active,
    };

    try {
      if (budget) {
        const { error } = await supabase.from('budgets').update(dbPayload).eq('id', budget.id);
        if (error) throw error;
        showSuccess("Budget updated successfully!");
      } else {
        const { error } = await supabase.from('budgets').insert(dbPayload);
        if (error) throw error;
        showSuccess("Budget created successfully!");
      }
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onOpenChange(false);
    } catch (error: any) {
      showError(`Failed to save budget: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? "Edit" : "Create"} Budget</DialogTitle>
          <DialogDescription>Set a spending target for a specific category.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories.filter(c => c.name !== 'Transfer').map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availableCurrencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
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
                    <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="frequency_value"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Frequency</FormLabel>
                    <FormControl><Input type="number" min="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency_unit"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="d">Days</SelectItem>
                        <SelectItem value="w">Weeks</SelectItem>
                        <SelectItem value="m">Months</SelectItem>
                        <SelectItem value="y">Years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>Uncheck to pause budget monitoring.</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
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