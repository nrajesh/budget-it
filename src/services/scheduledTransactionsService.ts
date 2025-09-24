import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Transaction } from '@/data/finance-data';
import { QueryObserverResult } from '@tanstack/react-query';
import { getAccountCurrency } from '@/integrations/supabase/utils';

interface ScheduledTransactionsServiceProps {
  refetchTransactions: () => Promise<QueryObserverResult<Transaction[], Error>>;
  userId: string | undefined;
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency: string) => number;
}

export type ScheduledTransaction = {
  id: string;
  date: string;
  account: string;
  vendor: string;
  category: string;
  amount: number;
  frequency: string;
  remarks?: string;
  user_id: string;
  created_at: string;
  last_processed_date?: string;
  recurrence_end_date?: string;
};

export const createScheduledTransactionsService = ({ refetchTransactions, userId, convertBetweenCurrencies }: ScheduledTransactionsServiceProps) => {

  const calculateNextOccurrence = (baseDateISO: string, frequency: string): string => {
    const baseDate = new Date(baseDateISO);
    const frequencyMatch = frequency.match(/^(\d+)([dwmy])$/);

    if (!frequencyMatch) return baseDateISO;

    const [, numStr, unit] = frequencyMatch;
    const num = parseInt(numStr, 10);
    const newDate = new Date(baseDate);

    switch (unit) {
      case 'd': newDate.setDate(newDate.getDate() + num); break;
      case 'w': newDate.setDate(newDate.getDate() + num * 7); break;
      case 'm': newDate.setMonth(newDate.getMonth() + num); break;
      case 'y': newDate.setFullYear(newDate.getFullYear() + num); break;
      default: return baseDateISO;
    }
    return newDate.toISOString();
  };

  const processScheduledTransactions = async () => {
    if (!userId) return;

    try {
      const { data: scheduledTransactions, error: fetchError } = await supabase
        .from('scheduled_transactions')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;
      if (!scheduledTransactions || scheduledTransactions.length === 0) return;

      const accountNames = [...new Set(scheduledTransactions.flatMap(st => [st.account, st.vendor]))];
      const { data: vendorAccountData, error: currencyError } = await supabase
        .from('vendors')
        .select('name, is_account, accounts(currency)')
        .in('name', accountNames);
      if (currencyError) throw currencyError;

      const currencyMap = new Map<string, string>();
      vendorAccountData?.forEach(item => {
        if (item.is_account && item.accounts && item.accounts.length > 0) {
          currencyMap.set(item.name, item.accounts[0].currency);
        }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const transactionsToAdd: Omit<Transaction, 'id' | 'created_at'>[] = [];
      const updatesToMake: { id: string; last_processed_date: string }[] = [];

      for (const st of scheduledTransactions) {
        let nextDateToProcess = new Date(st.date);
        nextDateToProcess.setHours(0, 0, 0, 0);
        let latestProcessedDateForThisST = st.last_processed_date ? new Date(st.last_processed_date) : null;
        if (latestProcessedDateForThisST) latestProcessedDateForThisST.setHours(0, 0, 0, 0);
        let newLastProcessedDateCandidate = latestProcessedDateForThisST;
        const recurrenceEndDate = st.recurrence_end_date ? new Date(st.recurrence_end_date) : null;
        if (recurrenceEndDate) recurrenceEndDate.setHours(23, 59, 59, 999);

        while (nextDateToProcess <= today) {
          if (recurrenceEndDate && nextDateToProcess > recurrenceEndDate) break;

          if (!latestProcessedDateForThisST || nextDateToProcess > latestProcessedDateForThisST) {
            const baseTransactionFields = {
              date: nextDateToProcess.toISOString(),
              account: st.account,
              vendor: st.vendor,
              category: st.category,
              amount: st.amount,
              remarks: st.remarks || undefined,
              currency: currencyMap.get(st.account) || 'USD',
              user_id: userId,
              is_scheduled_origin: true,
            };

            if (st.category === 'Transfer') {
              const transfer_id = `transfer_scheduled_${st.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
              const newAmount = Math.abs(st.amount);
              const sourceAccountCurrency = currencyMap.get(st.account) || 'USD';
              const destinationAccountCurrency = currencyMap.get(st.vendor) || 'USD';
              const convertedReceivingAmount = convertBetweenCurrencies(newAmount, sourceAccountCurrency, destinationAccountCurrency);
              transactionsToAdd.push({ ...baseTransactionFields, transfer_id, amount: -newAmount, remarks: `Transfer to ${st.vendor}` });
              transactionsToAdd.push({ ...baseTransactionFields, transfer_id, account: st.vendor, vendor: st.account, amount: convertedReceivingAmount, remarks: `Transfer from ${st.account}`, currency: destinationAccountCurrency });
            } else {
              transactionsToAdd.push(baseTransactionFields);
            }
            newLastProcessedDateCandidate = nextDateToProcess;
          }
          nextDateToProcess = new Date(calculateNextOccurrence(nextDateToProcess.toISOString(), st.frequency));
          nextDateToProcess.setHours(0, 0, 0, 0);
        }

        if (newLastProcessedDateCandidate && (!latestProcessedDateForThisST || newLastProcessedDateCandidate > latestProcessedDateForThisST)) {
          updatesToMake.push({ id: st.id, last_processed_date: newLastProcessedDateCandidate.toISOString() });
        }
      }

      if (transactionsToAdd.length > 0) {
        const { error: insertError } = await supabase.from('transactions').insert(transactionsToAdd);
        if (insertError) showError(`Failed to add some scheduled transactions: ${insertError.message}`);
      }

      if (updatesToMake.length > 0) {
        const updatePromises = updatesToMake.map(update =>
          supabase.from('scheduled_transactions').update({ last_processed_date: update.last_processed_date }).eq('id', update.id)
        );
        await Promise.all(updatePromises);
      }

      if (transactionsToAdd.length > 0) {
        await refetchTransactions();
      }
    } catch (error: any) {
      showError(`Failed to process scheduled transactions: ${error.message}`);
      throw error;
    }
  };

  const fetchScheduledTransactions = async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('scheduled_transactions')
      .select('*, recurrence_end_date')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data as ScheduledTransaction[];
  };

  return {
    processScheduledTransactions,
    fetchScheduledTransactions,
  };
};