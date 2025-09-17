import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useUser } from '@/contexts/UserContext';
import { fetchScheduledTransactions, ScheduledTransaction } from '@/services/scheduledTransactionsService';

interface UseTransactionDataProps {
  // Props if any, currently empty
}

export const useTransactionData = ({}: UseTransactionDataProps = {}) => {
  const { transactions, accountCurrencyMap, refetchTransactions } = useTransactions();
  const { user, isLoadingUser } = useUser();

  const { data: scheduledTransactions = [], isLoading: isLoadingScheduled, refetch: refetchScheduled } = useQuery({
    queryKey: ['scheduledTransactions', user?.id],
    queryFn: () => fetchScheduledTransactions(user!.id),
    enabled: !!user && !isLoadingUser,
  });

  const combinedTransactions = useMemo(() => {
    const upcomingTransactions = scheduledTransactions.map((st: ScheduledTransaction) => ({
      id: `scheduled-${st.id}`,
      date: st.date,
      account: st.account,
      vendor: st.vendor,
      category: st.category,
      amount: st.amount,
      remarks: st.remarks,
      currency: accountCurrencyMap[st.account] || 'USD',
      user_id: st.user_id,
      isScheduled: true,
    }));

    const allTransactions = [...transactions, ...upcomingTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return allTransactions;
  }, [transactions, scheduledTransactions, accountCurrencyMap]);

  return {
    allTransactions: combinedTransactions,
    isLoading: isLoadingUser || isLoadingScheduled,
    refetchAllTransactions: () => {
      refetchTransactions();
      refetchScheduled();
    },
  };
};