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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/contexts/TransactionsContext";
import { currencySymbols } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  date: z.date(),
  account: z.string().min(1, "Account is required"),
  vendor: z.string().min(1, "Vendor/Payee is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  remarks: z.string().optional(),
  receivingAmount: z.string().optional(),
  recurrenceFrequency: z.string().optional(),
  recurrenceEndDate: z.date().optional(),
});

type AddTransactionFormValues = z.infer<typeof formSchema>;

interface AddTransactionDialogProps {
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

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({ open, onOpenChange }) => {
  const { accounts, vendors, categories, addTransaction, accountCurrencyMap } = useTransactions();
  const [isTransfer, setIsTransfer] = useState(false);
  const [accountCurrencySymbol, setAccountCurrencySymbol] = useState<string>("$");
  const [destinationAccountCurrency, setDestinationAccountCurrency] = useState<string | null>(null);

  const allPayees = useMemo(() => {
    const combined = [...(accounts || []), ...(vendors || [])];
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts, vendors]);

  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      account: "",
      vendor: "",
      category: "Others",
      amount: "",
      remarks: "",
      receivingAmount: "",
      recurrenceFrequency: "None",
    },
  });

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

  const onSubmit = async (values: AddTransactionFormValues) => {
    const sendingCurrency = accountCurrencyMap.get(values.account);
    if (!sendingCurrency) {
      console.error("Could not determine currency for sending account");
      return;
    }

    const transactionData = {
      date: values.date.toISOString(),
      account: values.account,
      vendor: values.vendor,
      category: values.category,
      amount: -Math.abs(parseFloat(values.amount)),
      remarks: values.remarks || "",
      currency: sendingCurrency,
      transfer_id: null,
      is_scheduled_origin: false,
      recurrence_id: null,
      recurrence_frequency: values.recurrenceFrequency === "None" ? null : values.recurrenceFrequency,
      recurrence_end_date: values.recurrenceEndDate ? values.recurrenceEndDate.toISOString() : null,
    };

    addTransaction(transactionData);
    onOpenChange(false);
    form.reset();
  };

  const showReceivingValueField = isTransfer && accountValue && vendorValue && destinationAccountCurrency && (accountCurrencyMap.get(accountValue) !== destinationAccountCurrency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="date" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="account" render={({ field }) => ( <FormItem><FormLabel>Account</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger></FormControl><SelectContent>{accounts?.map((acc) => (<SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="vendor" render={({ field }) => ( <FormItem><FormLabel>Vendor/Payee</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a vendor or payee" /></SelectTrigger></FormControl><SelectContent>{allPayees.map((payee) => (<SelectItem key={payee.id} value={payee.name}>{payee.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{categories?.map((cat) => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="flex gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Amount ({accountCurrencySymbol})</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
              {showReceivingValueField && ( <FormField control={form.control} name="receivingAmount" render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Receiving Amount ({currencySymbols[destinationAccountCurrency!] || destinationAccountCurrency})</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} /> )}
            </div>
            <FormField control={form.control} name="remarks" render={({ field }) => ( <FormItem><FormLabel>Remarks</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter>
              <Button type="submit">Add Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};