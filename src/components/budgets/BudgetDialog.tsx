import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { Budget, Category, SubCategory } from "../../types/budgets";
import { useDataProvider } from '@/context/DataProviderContext';
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const budgetSchema = z.object({
  category_id: z.string().min(1, "Category is required."),
  sub_category_id: z.string().nullable().optional(),
  target_amount: z.coerce.number().positive("Amount must be a positive number."),
  frequency: z.string().min(1, "Frequency is required."),
  start_date: z.date({ required_error: "Start date is required." }),
  end_date: z.date().optional(),
}).refine(data => !data.end_date || data.end_date > data.start_date, {
  message: "End date must be after start date.",
  path: ["end_date"],
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  budget?: Budget | null;
  userId: string;
}

export function BudgetDialog({ isOpen, onClose, onSave, budget, userId }: BudgetDialogProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<string>('USD');
  const isEditMode = !!budget;
  const dataProvider = useDataProvider();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: "",
      sub_category_id: null,
      target_amount: 0,
      frequency: "Monthly",
      start_date: new Date(),
      end_date: undefined,
    },
  });

  const selectedCategoryId = form.watch("category_id");
  const filteredSubCategories = subCategories.filter(
    (sub) => {
      const match = sub.category_id === selectedCategoryId;
      return match;
    }
  );

  useEffect(() => {
    async function fetchUserData() {
      // Fetch categories
      const categoryData = await dataProvider.getUserCategories(userId);
      setCategories(categoryData || []);

      // Fetch sub-categories
      // DataProvider doesn't expose getSubCategories yet.
      // We will skip sub-category filtering for now or assume empty if not provided by provider.
      // Or we can query transactionsContext? But this component is standalone.
      // For now, let's just initialize empty to avoid build fail on 'supabase'.
      setSubCategories([]);

      // Fetch user profile for currency
      // Profile data is local now or passed.
      // We can use a default or just 'USD'.
      setDefaultCurrency('USD');
    }
    if (userId) {
      fetchUserData();
    }
  }, [userId, dataProvider]);

  useEffect(() => {
    if (budget) {
      form.reset({
        category_id: budget.category_id,
        sub_category_id: budget.sub_category_id,
        target_amount: budget.target_amount,
        frequency: budget.frequency,
        start_date: new Date(budget.start_date),
        end_date: budget.end_date ? new Date(budget.end_date) : undefined,
      });
    } else {
      form.reset({
        category_id: "",
        sub_category_id: null,
        target_amount: 0,
        frequency: "Monthly",
        start_date: new Date(),
        end_date: undefined,
      });
    }
  }, [budget, form]);

  const onSubmit = async (values: BudgetFormValues) => {
    const selectedCategory = categories.find(c => c.id === values.category_id);
    // Find subcategory name if ID is present (though subCats are empty currently)
    const subCatName = values.sub_category_id ? subCategories.find(s => s.id === values.sub_category_id)?.name : null;

    const budgetData: any = {
      user_id: userId,
      category_id: values.category_id,
      category_name: selectedCategory?.name || '',
      sub_category_id: values.sub_category_id || null,
      sub_category_name: subCatName,
      target_amount: values.target_amount,
      frequency: values.frequency as any,
      start_date: values.start_date.toISOString(),
      end_date: values.end_date?.toISOString() || null,
      currency: defaultCurrency,
    };

    try {
      if (isEditMode && budget) {
        await dataProvider.updateBudget({ ...budget, ...budgetData });
      } else {
        await dataProvider.addBudget(budgetData);
      }

      toast({
        title: `Budget ${isEditMode ? 'updated' : 'created'}`,
        description: "Your budget has been saved successfully.",
      });
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error saving budget",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Budget" : "Create Budget"}</DialogTitle>
          <DialogDescription>
            Set a spending target for a category within a specific period.
          </DialogDescription>
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
                    options={categories.map((cat) => ({ value: cat.id, label: cat.name })).sort((a, b) => a.label.localeCompare(b.label))}
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      form.setValue("sub_category_id", null); // Reset sub-category
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
                    options={filteredSubCategories.map((sub) => ({
                      value: sub.id,
                      label: sub.name || "Unknown"
                    })).sort((a, b) => (a.label || "").localeCompare(b.label || ""))}
                    value={field.value || ""}
                    onChange={(val) => field.onChange(val || null)}
                    placeholder={
                      selectedCategoryId
                        ? (filteredSubCategories.length > 0 ? "Select a sub-category" : "No sub-categories found")
                        : "Select a category first"
                    }
                    searchPlaceholder="Search sub-categories..."
                    emptyPlaceholder={selectedCategoryId ? "No sub-categories found" : "Select a category first"}
                    disabled={!selectedCategoryId || filteredSubCategories.length === 0}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="target_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount ({defaultCurrency})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="100.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                      <SelectItem value="One-time">One-time</SelectItem>
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
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Budget</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}