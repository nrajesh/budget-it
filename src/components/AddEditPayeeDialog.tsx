import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTransactions } from '@/contexts/TransactionsContext';

const formSchema = z.object({
  name: z.string().min(1, 'Payee name is required.'),
  is_account: z.boolean(),
  currency: z.string().optional(),
  starting_balance: z.number().optional(),
  remarks: z.string().optional(),
});

type PayeeFormValues = z.infer<typeof formSchema>;

interface AddEditPayeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payee?: any;
  isAccount: boolean;
  onSave: (data: any) => Promise<void>;
}

export const AddEditPayeeDialog: React.FC<AddEditPayeeDialogProps> = ({ open, onOpenChange, payee, isAccount, onSave }) => {
  const { availableCurrencies } = useCurrency();
  const form = useForm<PayeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      is_account: isAccount,
      currency: '',
      starting_balance: 0,
      remarks: '',
    },
  });

  useEffect(() => {
    if (payee) {
      form.reset({
        name: payee.name || '',
        is_account: payee.is_account,
        currency: payee.currency || '',
        starting_balance: payee.starting_balance || 0,
        remarks: payee.remarks || '',
      });
    } else {
      form.reset({
        name: '',
        is_account: isAccount,
        currency: '',
        starting_balance: 0,
        remarks: '',
      });
    }
  }, [payee, isAccount, form]);

  const isAccountType = form.watch('is_account');

  const handleSubmit = async (data: PayeeFormValues) => {
    await onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{payee ? 'Edit' : 'Add'} {isAccount ? 'Account' : 'Payee'}</DialogTitle>
          <DialogDescription>
            {isAccount ? 'Accounts are used for tracking balances, like bank accounts or credit cards.' : 'Payees are vendors or people you pay.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAccount ? 'Account Name' : 'Payee Name'}</FormLabel>
                  <FormControl>
                    <Input placeholder={`e.g., ${isAccount ? 'Chase Checking' : 'Starbucks'}`} {...field} />
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
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>This is an account</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {isAccountType && (
              <>
                <FormField
                  control={form.control}
                  name="starting_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Balance</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                      <FormControl>
                        <select {...field} className="w-full p-2 border rounded-md bg-transparent">
                          <option value="">Select a currency</option>
                          {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
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
                        <Input placeholder="Optional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};