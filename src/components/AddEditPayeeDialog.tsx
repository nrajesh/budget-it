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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path
import { useTransactions, Payee } from "@/contexts/TransactionsContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  is_account: z.boolean().default(false),
  currency: z.string().optional(),
  starting_balance: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().optional()
  ),
  remarks: z.string().optional(),
});

interface AddEditPayeeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  payee?: Payee;
  isAccount: boolean;
}

export const AddEditPayeeDialog: React.FC<AddEditPayeeDialogProps> = ({
  isOpen,
  onOpenChange,
  payee,
  isAccount,
}) => {
  const { availableCurrencies } = useCurrency();
  const { invalidateAllData } = useTransactions();
  const { addPayee, updatePayee, isAdding, isUpdating } = usePayeeManagement(isAccount);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      is_account: isAccount,
      currency: "USD",
      starting_balance: 0,
      remarks: "",
    },
  });

  useEffect(() => {
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
        is_account: isAccount,
        currency: "USD",
        starting_balance: 0,
        remarks: "",
      });
    }
  }, [payee, isOpen, isAccount, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (payee) {
        await updatePayee(payee.id, values);
      } else {
        await addPayee(values);
      }
      invalidateAllData();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save payee:", error);
    }
  };

  const title = payee
    ? `Edit ${isAccount ? "Account" : "Vendor"}`
    : `Add New ${isAccount ? "Account" : "Vendor"}`;

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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAccount ? "Account Name" : "Vendor Name"}</FormLabel>
                  <FormControl>
                    <Input placeholder={isAccount ? "Bank Account" : "Groceries Store"} {...field} />
                  </FormControl>
                  <FormMessage />
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
                        <Textarea placeholder="Any notes about this account" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isAdding || isUpdating}>
                {payee ? "Save Changes" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};