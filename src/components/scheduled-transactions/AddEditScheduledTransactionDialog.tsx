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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import { ScheduledTransaction as ScheduledTransactionType } from "@/types/dataProvider";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { Payee } from "@/components/dialogs/AddEditPayeeDialog";
import { Category } from "@/data/finance-data";

interface AddEditScheduledTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: ScheduledTransactionType | null;
  onSubmit: (
    values: Omit<ScheduledTransactionType, "id" | "created_at" | "user_id">,
  ) => void;
  isSubmitting: boolean;
  accounts: Payee[];
  allPayees: { value: string; label: string; isAccount: boolean }[];
  categories: Category[];
  allSubCategories: string[];
  isLoading: boolean;
}

export const AddEditScheduledTransactionDialog: React.FC<
  AddEditScheduledTransactionDialogProps
> = ({
  isOpen,
  onOpenChange,
  transaction,
  onSubmit,
  isSubmitting,
  accounts,
  allPayees,
  categories,
  allSubCategories,
  isLoading,
}) => {
    const formSchema = React.useMemo(
      () =>
        z
          .object({
            date: z.string().min(1, "Date is required"),
            account: z.string().min(1, "Account is required"),
            vendor: z.string().min(1, "Vendor is required"),
            category: z.string().min(1, "Category is required"),
            sub_category: z.string().optional(),
            amount: z.coerce
              .number()
              .refine((val) => val !== 0, { message: "Amount cannot be zero" }),
            frequency_value: z.coerce
              .number()
              .min(1, "Frequency value must be at least 1"),
            frequency_unit: z.string().min(1, "Frequency unit is required"),
            remarks: z.string().optional(),
            recurrence_end_date: z.string().optional(),
          })
          .refine(
            (data) => {
              const isVendorAnAccount = allPayees.find(
                (p) => p.value === data.vendor,
              )?.isAccount;
              if (isVendorAnAccount && data.category !== "Transfer") return false;
              if (!isVendorAnAccount && data.category === "Transfer")
                return false;
              return true;
            },
            {
              message:
                "Category must be 'Transfer' if vendor is an account, otherwise it cannot be 'Transfer'.",
              path: ["category"],
            },
          ),
      [allPayees],
    );

    type ScheduledTransactionFormData = z.infer<typeof formSchema>;

    const form = useForm<ScheduledTransactionFormData>({
      resolver: zodResolver(formSchema),
      mode: "onChange",
    });

    const tomorrowDateString = React.useMemo(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return formatDateToYYYYMMDD(tomorrow);
    }, []);

    const dayAfterTomorrowDateString = React.useMemo(() => {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      return formatDateToYYYYMMDD(dayAfter);
    }, []);

    React.useEffect(() => {
      if (isOpen) {
        if (transaction) {
          const frequencyMatch = transaction.frequency.match(/^(\d+)([dwmy])$/);
          form.reset({
            date: formatDateToYYYYMMDD(transaction.date),
            account: transaction.account,
            vendor: transaction.vendor,
            category: transaction.category,
            sub_category: transaction.sub_category || "",
            amount: transaction.amount,
            frequency_value: frequencyMatch ? parseInt(frequencyMatch[1], 10) : 1,
            frequency_unit: frequencyMatch ? frequencyMatch[2] : "m",
            remarks: transaction.remarks || "",
            recurrence_end_date: transaction.end_date
              ? formatDateToYYYYMMDD(transaction.end_date)
              : "",
          });
        } else {
          form.reset({
            date: tomorrowDateString,
            account: "",
            vendor: "",
            category: "",
            sub_category: "",
            amount: 0,
            frequency_value: 1,
            frequency_unit: "m",
            remarks: "",
            recurrence_end_date: "",
          });
        }
      }
    }, [isOpen, transaction, form, tomorrowDateString]);

    const watchedVendor = form.watch("vendor");
    const isVendorAnAccount = React.useMemo(() => {
      return allPayees.find((p) => p.value === watchedVendor)?.isAccount || false;
    }, [watchedVendor, allPayees]);

    React.useEffect(() => {
      if (isVendorAnAccount) {
        form.setValue("category", "Transfer", { shouldValidate: true });
        form.setValue("sub_category", "", { shouldValidate: true });
      } else if (form.getValues("category") === "Transfer") {
        form.setValue("category", "", { shouldValidate: true });
      }
    }, [isVendorAnAccount, form]);

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {transaction ? "Edit" : "Add"} Scheduled Transaction
            </DialogTitle>
            <DialogDescription>
              Define a recurring transaction. Occurrences up to today will be
              automatically added to your transactions.
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => {
                  // Construct frequency string
                  const frequency = `${values.frequency_value}${values.frequency_unit}`;
                  // Get currency from selected account
                  const selectedAccount = accounts.find(
                    (a) => a.name === values.account,
                  );
                  const currency = selectedAccount?.currency || "USD";

                  onSubmit({ ...values, frequency, currency });
                })}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min={tomorrowDateString}
                          />
                        </FormControl>
                        <FormDescription>
                          Only future dates (from tomorrow onwards) can be
                          selected.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recurrence_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={
                              form.watch("date")
                                ? formatDateToYYYYMMDD(
                                  new Date(
                                    Math.max(
                                      new Date(form.watch("date")).getTime(),
                                      new Date(
                                        dayAfterTomorrowDateString,
                                      ).getTime(),
                                    ),
                                  ),
                                )
                                : dayAfterTomorrowDateString
                            }
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Must be after the start date.
                        </FormDescription>
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
                          options={accounts.map((account) => ({
                            value: account.name,
                            label: account.name,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          onCreate={(value) => field.onChange(value)}
                          placeholder="Select account"
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
                        <FormLabel>Vendor / Account</FormLabel>
                        <Combobox
                          options={allPayees.map((payee) => ({
                            value: payee.value,
                            label: payee.label,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          onCreate={(value) => field.onChange(value)}
                          placeholder="Select vendor or account"
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
                          options={categories.map((category) => ({
                            value: category.name,
                            label: category.name,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          onCreate={(value) => field.onChange(value)}
                          placeholder="Select category"
                          searchPlaceholder="Search categories..."
                          emptyPlaceholder="No category found."
                          disabled={isVendorAnAccount}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sub_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub-category</FormLabel>
                        <Combobox
                          options={allSubCategories.map((sub) => ({
                            value: sub,
                            label: sub,
                          }))}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onCreate={(value) => field.onChange(value)}
                          placeholder="Select or create..."
                          searchPlaceholder="Search sub-categories..."
                          emptyPlaceholder="No sub-category found."
                          disabled={isVendorAnAccount}
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
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              // Let the string value pass through. Zod schema handles coercion.
                              // This allows typing "-" without it becoming NaN immediately.
                              field.onChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name="frequency_value"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormLabel>Frequency</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value, 10))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="frequency_unit"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
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
                </div>
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    );
  };
