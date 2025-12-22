import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/hooks/useCurrency';

export const useTransactionManagement = () => {
  const {
    transactions: allTransactions,
    accountCurrencyMap,
    refetchTransactions
  } = useTransactions();
  const { formatCurrency } = useCurrency();

  // ... rest of the hook implementation
};