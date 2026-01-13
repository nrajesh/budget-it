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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";

export type Payee = {
  id: string;
  name: string;
  is_account: boolean;
  created_at: string;
  account_id: string | null;
  currency: string | null;
  starting_balance: number | null;
  remarks: string | null;
  running_balance: number | null;
  totalTransactions?: number;
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  is_account: z.boolean(),
  currency: z.string().optional(),
  starting_balance: z.coerce.number().optional(),
  remarks: z.string().optional(),
});

interface AddEditPayeeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  payee: Payee | null;
  onSuccess: () => void;
  isAccountOnly?: boolean;
}

const AddEditPayeeDialog: React.FC<AddEditPayeeDialogProps> = ({
  isOpen,
  onOpenChange,
  payee,
  onSuccess,
  isAccountOnly = false,
}) => {
  const { availableCurrencies } = useCurrency();
  const { invalidateAllData } = useTransactions();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      is_account: isAccountOnly ? true : false,
      currency: "EUR",
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
        currency: payee.currency || "EUR",
        starting_balance: payee.starting_balance || 0,
        remarks: payee.remarks || "",
      });
    } else {
      form.reset({
        name: "",
        is_account: isAccountOnly ? true : false,
        currency: "EUR",
        starting_balance: 0,
        remarks: "",
      });
    }
  }, [payee, form, isOpen, isAccountOnly]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (payee) {
        if (payee.name !== values.name) {
          const { error: rpcError } = await supabase.rpc('update_vendor_name', {
            p_vendor_id: payee.id,
            p_new_name: values.name,
          });
          if (rpcError) throw rpcError;
        }
        if (payee.is_account && payee.account_id) {
          const { error } = await supabase
            .from("accounts")
            .update({
              currency: values.currency,
              starting_balance: values.starting_balance,
              remarks: values.remarks,
            })
            .eq("id", payee.account_id);
          if (error) throw error;
        }
        showSuccess("Payee updated successfully!");
      } else {
        if (values.is_account) {
          const { data: accountData, error: accountError } = await supabase
            .from("accounts")
            .insert({
              currency: values.currency,
              starting_balance: values.starting_balance,
              remarks: values.remarks,
            })
            .select()
            .single();
          if (accountError) throw accountError;

          const { error: vendorError } = await supabase.from("vendors").insert({
            name: values.name,
            is_account: true,
            account_id: accountData.id,
          });
          if (vendorError) throw vendorError;
        } else {
          const { error } = await supabase.from("vendors").insert({ name: values.name });
          if (error) throw error;
        }
        showSuccess("Payee added successfully!");
      }
      onSuccess();
      await invalidateAllData();
      onOpenChange(false);
    } catch (error: any) {
      showError(`Error: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{payee ? "Edit" : "Add"} Payee</DialogTitle>
          <DialogDescription>
            {payee ? "Update the details of the payee." : "Add a new vendor or account to your list."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SuperMart, Salary, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!(payee && payee.is_account) && (
              <FormField
                control={form.control}
                name="is_account"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!!payee || isAccountOnly}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Is this an account?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}
            {isAccount && (
              <div className="space-y-4 p-4 border rounded-md">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Combobox
                        options={availableCurrencies.map(c => ({ value: c.code, label: c.code })).sort((a, b) => a.label.localeCompare(b.label))}
                        value={field.value || "EUR"}
                        onChange={field.onChange}
                        placeholder="Select currency"
                        searchPlaceholder="Search currency..."
                        emptyPlaceholder="No currency found."
                      />
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
              </div>
            )}
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditPayeeDialog;