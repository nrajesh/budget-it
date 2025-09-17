import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Payee } from '@/data/finance-data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  currency: z.string().optional(),
  starting_balance: z.coerce.number().optional(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddEditPayeeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  payee: Payee | null;
  isAccount: boolean;
}

const AddEditPayeeDialog: React.FC<AddEditPayeeDialogProps> = ({ isOpen, onOpenChange, payee, isAccount }) => {
  const { availableCurrencies } = useCurrency();
  const { refetchAllPayees } = useTransactions();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      currency: 'USD',
      starting_balance: 0,
      remarks: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (payee) {
        form.reset({
          name: payee.name,
          currency: payee.currency || 'USD',
          starting_balance: payee.starting_balance || 0,
          remarks: payee.remarks || '',
        });
      } else {
        form.reset({
          name: '',
          currency: 'USD',
          starting_balance: 0,
          remarks: '',
        });
      }
    }
  }, [isOpen, payee, form]);

  const dialogTitle = payee ? `Edit ${isAccount ? 'Account' : 'Vendor'}` : `Add New ${isAccount ? 'Account' : 'Vendor'}`;
  const dialogDescription = `Fill in the details for the ${isAccount ? 'account' : 'vendor'}.`;

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (payee) {
        // Update logic
        if (isAccount && payee.account_id) {
          const { error: accountError } = await supabase
            .from('accounts')
            .update({
              currency: values.currency,
              starting_balance: values.starting_balance,
              remarks: values.remarks,
            })
            .eq('id', payee.account_id);
          if (accountError) throw accountError;
        }
        // Update vendor name if it has changed
        if (payee.name !== values.name) {
            const { error: vendorError } = await supabase
            .rpc('update_vendor_name', { p_vendor_id: payee.id, p_new_name: values.name });
            if (vendorError) throw vendorError;
        }
        showSuccess(`${isAccount ? 'Account' : 'Vendor'} updated successfully!`);
      } else {
        // Insert logic
        if (isAccount) {
            const { error } = await supabase.rpc('batch_upsert_accounts', {
                p_accounts: [{
                    name: values.name,
                    currency: values.currency,
                    starting_balance: values.starting_balance,
                    remarks: values.remarks
                }]
            });
            if (error) throw error;
        } else {
            const { error } = await supabase.rpc('batch_upsert_vendors', { p_names: [values.name] });
            if (error) throw error;
        }
        showSuccess(`${isAccount ? 'Account' : 'Vendor'} added successfully!`);
      }
      await refetchAllPayees();
      onOpenChange(false);
    } catch (error: any) {
      showError(`Failed to save: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
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
                    <Input {...field} />
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
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCurrencies.map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
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
                        <Input type="number" {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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

export default AddEditPayeeDialog;