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
import { Combobox } from "@/components/ui/combobox";
import { useUser } from "@/contexts/UserContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { showError, showSuccess } from "@/utils/toast";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { useDataProvider } from '@/context/DataProviderContext';
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Budget } from "@/data/finance-data";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddEditBudgetDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  budget: Budget | null;
  allBudgets: Budget[];
  onSuccess?: () => void;
}

export const AddEditBudgetDialog: React.FC<AddEditBudgetDialogProps> = ({ isOpen, onOpenChange, budget, allBudgets, onSuccess }) => {
  const { user } = useUser();
  const { categories, subCategories, accounts } = useTransactions();
  const { availableCurrencies, selectedCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const accountTypes = React.useMemo(() => {
    const types = new Set(accounts.map(a => a.type || 'Other'));
    return Array.from(types).sort();
  }, [accounts]);

  const formSchema = React.useMemo(() => z.object({
    category_id: z.string().min(1, "Category is required"),
    sub_category_id: z.string().nullable().optional(),
    target_amount: z.coerce.number().positive("Target amount must be positive"),
    currency: z.string().min(1, "Currency is required"),
    start_date: z.string().min(1, "Start date is required"),
    frequency_value: z.coerce.number().min(1, "Frequency value must be at least 1"),
    frequency_unit: z.string().min(1, "Frequency unit is required"),
    end_date: z.string().optional(),
    is_active: z.boolean(),
    account_scope: z.enum(['ALL', 'GROUP']),
    account_scope_values: z.array(z.string()).optional(),
  }).superRefine((data, ctx) => {
    if (data.account_scope === 'GROUP' && (!data.account_scope_values || data.account_scope_values.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select at least one account group.",
        path: ["account_scope_values"],
      });
    }

    if (!allBudgets) return;
    const frequency = `${data.frequency_value}${data.frequency_unit}`;
    const startDate = new Date(data.start_date).toLocaleDateString('en-CA');

    const isDuplicate = allBudgets.some(b =>
      b.id !== budget?.id &&
      b.category_id === data.category_id &&
      b.sub_category_id === (data.sub_category_id || null) &&
      b.frequency === frequency &&
      new Date(b.start_date).toLocaleDateString('en-CA') === startDate &&
      b.account_scope === data.account_scope &&
      (
        (b.account_scope === 'ALL') ||
        (JSON.stringify(b.account_scope_values?.slice().sort()) === JSON.stringify(data.account_scope_values?.slice().sort()))
      )
    );

    if (isDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A budget with these parameters already exists.",
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
      sub_category_id: null,
      account_scope: 'ALL',
      account_scope_values: [],
    },
  });

  // Watch category_id to filter sub-categories
  const selectedCategoryId = form.watch("category_id");

  const filteredSubCategories = React.useMemo(() => {
    if (!selectedCategoryId) return [];
    return subCategories.filter(sub => sub.category_id === selectedCategoryId);
  }, [selectedCategoryId, subCategories]);

  // Reset logic
  React.useEffect(() => {
    if (isOpen) {
      if (budget) {
        let frequencyVal = 1;
        let frequencyUnit = 'm';

        // Handle legacy frequencies
        if (budget.frequency === 'Monthly') { frequencyVal = 1; frequencyUnit = 'm'; }
        else if (budget.frequency === 'Quarterly') { frequencyVal = 3; frequencyUnit = 'm'; }
        else if (budget.frequency === 'Yearly') { frequencyVal = 1; frequencyUnit = 'y'; }
        else if (budget.frequency === 'One-time') { frequencyVal = 1; frequencyUnit = 'm'; } // Defaulting one-time to 1m for now or need better handling? One-time budgets usually don't recur. AddEditDialog assumes recurrence.
        else {
          const frequencyMatch = budget.frequency.match(/^(\d+)([dwmy])$/);
          if (frequencyMatch) {
            frequencyVal = parseInt(frequencyMatch[1], 10);
            frequencyUnit = frequencyMatch[2];
          }
        }

        form.reset({
          category_id: budget.category_id,
          sub_category_id: budget.sub_category_id,
          target_amount: budget.target_amount,
          currency: budget.currency,
          start_date: formatDateToYYYYMMDD(budget.start_date),
          frequency_value: frequencyVal,
          frequency_unit: frequencyUnit,
          end_date: budget.end_date ? formatDateToYYYYMMDD(budget.end_date) : "",
          is_active: budget.is_active,
          account_scope: budget.account_scope || 'ALL',
          account_scope_values: budget.account_scope_values || [],
        });
      } else {
        form.reset({
          category_id: "",
          sub_category_id: null,
          target_amount: 0,
          currency: selectedCurrency,
          start_date: formatDateToYYYYMMDD(new Date()),
          frequency_value: 1,
          frequency_unit: 'm',
          end_date: "",
          is_active: true,
          account_scope: 'ALL',
          account_scope_values: [],
        });
      }
    }
  }, [isOpen, budget, form, selectedCurrency]);

  const onSubmit = async (values: BudgetFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    const frequency = `${values.frequency_value}${values.frequency_unit}`;
    const selectedCategory = categories.find(c => c.id === values.category_id);
    const subCatName = values.sub_category_id ? subCategories.find(s => s.id === values.sub_category_id)?.name : null;

    const dbPayload: any = {
      user_id: user.id,
      category_id: values.category_id,
      category_name: selectedCategory?.name || '',
      sub_category_id: values.sub_category_id || null,
      sub_category_name: subCatName,
      target_amount: values.target_amount,
      currency: values.currency,
      start_date: new Date(values.start_date).toISOString(),
      frequency: frequency as any,
      end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
      is_active: values.is_active,
      account_scope: values.account_scope,
      account_scope_values: values.account_scope === 'GROUP' ? values.account_scope_values : null,
    };

    try {
      if (budget) {
        await dataProvider.updateBudget({ ...budget, ...dbPayload });
        showSuccess("Budget updated successfully!");
      } else {
        await dataProvider.addBudget(dbPayload);
        showSuccess("Budget created successfully!");
      }
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      showError(`Failed to save budget: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{budget ? "Edit" : "Create"} Budget</DialogTitle>
          <DialogDescription>Set a spending target for a category or sub-category.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Combobox
                    options={categories.filter(c => c.name !== 'Transfer').map(cat => ({ value: cat.id, label: cat.name })).sort((a, b) => a.label.localeCompare(b.label))}
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      // Reset sub-category when category changes
                      form.setValue("sub_category_id", null);
                    }}
                    placeholder="Select a category"
                    searchPlaceholder="Search categories..."
                    emptyPlaceholder="No category found."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sub_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-category (Optional)</FormLabel>
                  <Combobox
                    options={filteredSubCategories.map(sub => ({ value: sub.id, label: sub.name })).sort((a, b) => a.label.localeCompare(b.label))}
                    value={field.value || ""}
                    onChange={(val) => field.onChange(val || null)}
                    placeholder={selectedCategoryId ? (filteredSubCategories.length > 0 ? "Select a sub-category" : "No sub-categories found") : "Select a category first"}
                    searchPlaceholder="Search sub-categories..."
                    emptyPlaceholder={selectedCategoryId ? "No sub-categories found" : "Select a category first"}
                    disabled={!selectedCategoryId || filteredSubCategories.length === 0}
                  />
                  <FormDescription>Select a sub-category to target specifically, or leave empty for the whole category.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scope Selection */}
            <FormField
              control={form.control}
              name="account_scope"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Budget Scope</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ALL" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          All Accounts
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="GROUP" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Specific Account Groups
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("account_scope") === 'GROUP' && (
              <FormField
                control={form.control}
                name="account_scope_values"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Select Account Groups</FormLabel>
                      <FormDescription>
                        Select the account groups this budget applies to.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {accountTypes.map((type) => (
                        <FormField
                          key={type}
                          control={form.control}
                          name="account_scope_values"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={type}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(type)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), type])
                                        : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== type
                                          )
                                        )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {type}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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