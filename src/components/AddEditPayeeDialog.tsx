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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2 } from "lucide-react";

export interface Payee {
  id: string;
  name: string;
  is_account: boolean;
  account_id?: string | null;
  currency?: string;
  starting_balance?: number;
  remarks?: string;
  created_at?: string;
  running_balance?: number;
  totalTransactions?: number;
}

interface AddEditPayeeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  payee: Payee | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Payee name is required."),
  is_account: z.boolean(),
  currency: z.string().optional(),
  starting_balance: z.coerce.number().optional(),
  remarks: z.string().optional(),
});

type PayeeFormData = z.infer<typeof formSchema>;

export const AddEditPayeeDialog: React.FC<AddEditPayeeDialogProps> = ({
  isOpen,
  onOpenChange,
  payee,
}) => {
  const { currencies: availableCurrencies } = useCurrency();
  const { invalidateAllData } = useTransactions();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PayeeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      is_account: false,
      currency: "USD",
      starting_balance: 0,
      remarks: "",
    },
  });

  const isAccount = form.watch("is_account");

  React.useEffect(() => {
    if (payee) {
      form.reset({
        name: payee.name,
        is_account: payee.is_account,
        currency: payee.currency || "USD",
        starting_balance: payee.starting_balance || 0,
        remarks: payee.remarks || "",
      });
    } else {
      form.reset({
        name: "",
        is_account: false,
        currency: "USD",
        starting_balance: 0,
        remarks: "",
      });
    }
  }, [payee, form]);

  const handleSubmit = async (data: PayeeFormData) => {
    setIsSubmitting(true);
    try {
      if (payee) {
        // Update logic
        if (payee.is_account && payee.account_id) {
          // It's an account, update both vendors and accounts table
          const { error: vendorError } = await supabase
            .from("vendors")
            .update({ name: data.name })
            .eq("id", payee.id);
          if (vendorError) throw vendorError;

          const { error: accountError } = await supabase
            .from("accounts")
            .update({
              currency: data.currency,
              starting_balance: data.starting_balance,
              remarks: data.remarks,
            })
            .eq("id", payee.account_id);
          if (accountError) throw accountError;
        } else {
          // It's a regular vendor
          const { error } = await supabase
            .from("vendors")
            .update({ name: data.name })
            .eq("id", payee.id);
          if (error) throw error;
        }
        showSuccess("Payee updated successfully.");
      } else {
        // Create logic
        if (data.is_account) {
          // Create an account
          const { data: accountData, error: accountError } = await supabase
            .from("accounts")
            .insert({
              currency: data.currency,
              starting_balance: data.starting_balance,
              remarks: data.remarks,
            })
            .select()
            .single();
          if (accountError) throw accountError;

          const { error: vendorError } = await supabase.from("vendors").insert({
            name: data.name,
            is_account: true,
            account_id: accountData.id,
          });
          if (vendorError) throw vendorError;
        } else {
          // Create a regular vendor
          const { error } = await supabase
            .from("vendors")
            .insert({ name: data.name, is_account: false });
          if (error) throw error;
        }
        showSuccess("Payee created successfully.");
      }
      await invalidateAllData();
      onOpenChange(false);
    } catch (error: any) {
      showError(`Failed to save payee: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{payee ? "Edit Payee" : "Add New Payee"}</DialogTitle>
          <DialogDescription>
            {payee
              ? "Update the details for this payee or account."
              : "Add a new payee (e.g., a store) or a new account (e.g., a bank account)."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SuperMart or Savings Account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_account"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!!payee} // Disable if editing
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>This is an account</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            {isAccount && (
              <>
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCurrencies.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.name} ({c.code})
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
                  name="starting_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Balance</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
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
                        <Textarea placeholder="Optional notes about the account" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
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