import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';

export const useTransactionManagement = () => {
  const { transactions: allTransactions, accountCurrencyMap, refetchTransactions } = useTransactions();
  const { formatCurrency } = useCurrency();
  // ... other logic
  return {
    // ... returned values
  };
};