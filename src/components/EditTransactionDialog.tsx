"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Transaction } from "@/types/finance";
import { currencySymbols } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  date: z.date(),
  account: z.string().min(1, "Account is required"),
  vendor: z.string().min(1, "Vendor/Payee is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: "Amount must be a number",
  }),
  remarks: z.string().optional(),
  recurrenceFrequency: z.string().optional(),
  recurrenceEndDate: z.date().optional().nullable(),
});

type EditTransactionFormValues = z.infer<typeof formSchema>;

interface EditTransactionDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getAccountCurrency = async (accountName: string): Promise<string> => {
  const { data } = await supabase
    .from('vendors')
    .select('accounts(currency)')
    .eq('name', accountName)
    .single();
  return (data as any)?.accounts?.currency || 'USD';
};

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({ transaction, open, onOpenChange }) => {
  const { accounts, vendors, categories, updateTransaction, deleteTransaction, accountCurrencyMap } = useTransactions();
  const [isTransfer, setIsTransfer] = useState(false);
  const [accountCurrencySymbol, setAccountCurrencySymbol] = useState<string>("$");
  const [destinationAccountCurrency, setDestinationAccountCurrency] = useState<string | null>(null);

  const allPayees = useMemo(() => {
    const combined = [...(accounts || []), ...(vendors || [])];
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts, vendors]);

  const form = useForm<EditTransactionFormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        date: new Date(transaction.date),
        account: transaction.account,
        vendor: transaction.vendor || "",
        category: transaction.category,
        amount: String(Math.abs(transaction.amount)),
        remarks: transaction.remarks || "",
        recurrenceFrequency: transaction.recurrence_frequency || "None",
        recurrenceEndDate: transaction.recurrence_end_date ? new Date(transaction.recurrence_end_date) : null,
      });
    }
  }, [transaction, form]);

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");

  useEffect(() => {
    const selectedVendor = allPayees.find(p => p.name === vendorValue);
    setIsTransfer(selectedVendor?.is_account || false);
  }, [vendorValue, allPayees]);

  useEffect(() => {
    const updateCurrency = async () => {
      if (accountValue) {
        const currencyCode = accountCurrencyMap.get(accountValue) || await getAccountCurrency(accountValue);
        setAccountCurrencySymbol(currencySymbols[currencyCode] || currencyCode);
      }
    };
    updateCurrency();
  }, [accountValue, accountCurrencyMap]);

  useEffect(() => {
    const updateDestinationCurrency = async () => {
      if (isTransfer && vendorValue) {
        const currencyCode = accountCurrencyMap.get(vendorValue) || await getAccountCurrency(vendorValue);
        setDestinationAccountCurrency(currencyCode);
      } else {
        setDestinationAccountCurrency(null);
      }
    };
    updateDestinationCurrency();
  }, [isTransfer, vendorValue, accountCurrencyMap]);

  const onSubmit = (values: EditTransactionFormValues) => {
    const updatedTransaction = {
      id: transaction.id,
      ...values,
      date: values.date.toISOString(),
      amount: -Math.abs(parseFloat(values.amount)),
      currency: accountCurrencyMap.get(values.account) || transaction.currency,
      recurrence_frequency: values.recurrenceFrequency === "None" ? null : values.recurrenceFrequency,
      recurrence_end_date: values.recurrenceEndDate ? values.recurrenceEndDate.toISOString() : null,
    };
    updateTransaction(updatedTransaction);
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Form Fields will be added here */}
            <DialogFooter className="flex justify-between w-full">
              <Button type="button" variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};