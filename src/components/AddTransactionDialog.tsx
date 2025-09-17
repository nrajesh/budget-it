import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
// ... other imports

const formSchema = z.object({
  // ... schema definition
  amount: z.string(),
  account: z.string(),
  destinationAccount: z.string().optional(),
});

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({ isOpen, onOpenChange }) => {
  const { addTransaction, accountCurrencyMap, categories: allCategories, accounts, vendors } = useTransactions();
  const { convertAmount, formatCurrency } = useCurrency();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // ... default values
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // ... submit logic
  };
  
  const sourceAccount = form.watch('account');
  const destinationAccount = form.watch('destinationAccount');
  const sourceAccountCurrency = accountCurrencyMap[sourceAccount];
  const destinationAccountCurrency = destinationAccount ? accountCurrencyMap[destinationAccount] : undefined;
  const amountValue = form.watch('amount');

  const autoCalculatedReceivingAmount = React.useMemo(() => {
    if (sourceAccountCurrency && destinationAccountCurrency && amountValue) {
      return convertAmount(
        parseFloat(amountValue),
        sourceAccountCurrency,
        destinationAccountCurrency
      );
    }
    return 0;
  }, [amountValue, sourceAccountCurrency, destinationAccountCurrency, convertAmount]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Fill in the details of your new transaction.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* ... other form fields */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {destinationAccountCurrency && (
              <FormItem>
                <FormLabel>Receiving Amount</FormLabel>
                <FormControl>
                  <Input type="number" value={autoCalculatedReceivingAmount.toFixed(2)} readOnly />
                </FormControl>
                <FormDescription>
                  This is the amount received in the destination account's currency. Auto-calculated: {formatCurrency(autoCalculatedReceivingAmount, destinationAccountCurrency || 'USD')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
            <DialogFooter>
              <Button type="submit">Add Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;