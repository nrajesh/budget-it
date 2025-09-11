import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Transaction } from '@/data/finance-data';
import { QueryObserverResult } from '@tanstack/react-query';
import { getAccountCurrency } from '@/integrations/supabase/utils'; // Import getAccountCurrency
import { useCurrency } from '@/contexts/CurrencyContext'; // Import useCurrency to get convertBetweenCurrencies

interface ScheduledTransactionsServiceProps {
  fetchTransactions: () => Promise<QueryObserverResult<Transaction[], Error>>;
  userId: string | undefined;
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

export const createScheduledTransactionsService = ({ fetchTransactions, userId }: ScheduledTransactionsServiceProps) => {
  const { convertBetweenCurrencies } = useCurrency(); // Use useCurrency hook here

  // Function to calculate the next occurrence date based on frequency
  const calculateNextOccurrence = (baseDateISO: string, frequency: string): string => {
    const baseDate = new Date(baseDateISO);
    const frequencyMatch = frequency.match(/^(\d+)([dwmy])$/);

    if (!frequencyMatch) {
      return baseDateISO;
    }

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
    if (!userId) {
      console.warn("User not logged in. Cannot process scheduled transactions.");
      return;
    }

    try {
      const { data: scheduledTransactions, error: fetchError } = await supabase
        .from('scheduled_transactions')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;
      if (!scheduledTransactions || scheduledTransactions.length === 0) {
        return;
      }

      // Get currencies for all relevant accounts in one go
      const accountNames = [...new Set(scheduledTransactions.flatMap(st => [st.account, st.vendor]))]; // Include vendors as they might be destination accounts
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
      today.setHours(0, 0, 0, 0); // Normalize today to start of day

      const transactionsToAdd: Omit<Transaction, 'id' | 'created_at'>[] = [];
      const updatesToMake: { id: string; last_processed_date: string }[] = [];

      for (const st of scheduledTransactions) {
        let nextDateToProcess = new Date(st.date); // Always start from the original scheduled date
        nextDateToProcess.setHours(0, 0, 0, 0);

        let latestProcessedDateForThisST = st.last_processed_date ? new Date(st.last_processed_date) : null;
        if (latestProcessedDateForThisST) {
            latestProcessedDateForThisST.setHours(0, 0, 0, 0);
        }

        let newLastProcessedDateCandidate = latestProcessedDateForThisST;

        const recurrenceEndDate = st.recurrence_end_date ? new Date(st.recurrence_end_date) : null;
        if (recurrenceEndDate) recurrenceEndDate.setHours(23, 59, 59, 999); // Normalize to end of day

        // Loop to find all occurrences that should have been processed up to today
        while (nextDateToProcess <= today) {
            // If an end date exists and the next date to process is beyond it, break
            if (recurrenceEndDate && nextDateToProcess > recurrenceEndDate) {
                break;
            }

            // Only add if this occurrence hasn't been processed yet
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

                // If category is 'Transfer', create two transactions
                if (st.category === 'Transfer') {
                    const transfer_id = `transfer_scheduled_${st.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                    const newAmount = Math.abs(st.amount);

                    const sourceAccountCurrency = currencyMap.get(st.account) || 'USD';
                    const destinationAccountCurrency = currencyMap.get(st.vendor) || 'USD';

                    const convertedReceivingAmount = convertBetweenCurrencies(
                      newAmount,
                      sourceAccountCurrency,
                      destinationAccountCurrency
                    );

                    // Debit transaction
                    transactionsToAdd.push({
                        ...baseTransactionFields,
                        transfer_id: transfer_id,
                        amount: -newAmount,
                        remarks: baseTransactionFields.remarks ? `${baseTransactionFields.remarks} (To ${st.vendor})` : `Transfer to ${st.vendor}`,
                    });

                    // Credit transaction
                    transactionsToAdd.push({
                        ...baseTransactionFields,
                        transfer_id: transfer_id,
                        account: st.vendor, // Destination account
                        vendor: st.account, // Source account
                        amount: convertedReceivingAmount,
                        remarks: baseTransactionFields.remarks ? `${baseTransactionFields.remarks} (From ${st.account})` : `Transfer from ${st.account}`,
                        currency: destinationAccountCurrency,
                    });
                } else {
                    // For non-transfer categories, add a single transaction
                    transactionsToAdd.push(baseTransactionFields);
                }
                newLastProcessedDateCandidate = nextDateToProcess;
            }
            nextDateToProcess = new Date(calculateNextOccurrence(nextDateToProcess.toISOString(), st.frequency));
            nextDateToProcess.setHours(0, 0, 0, 0);
        }

        // If new transactions were added or the last_processed_date needs to be updated
        if (newLastProcessedDateCandidate && (!latestProcessedDateForThisST || newLastProcessedDateCandidate > latestProcessedDateForThisST)) {
            updatesToMake.push({
                id: st.id,
                last_processed_date: newLastProcessedDateCandidate.toISOString(),
            });
        }
      }

      if (transactionsToAdd.length > 0) {
        const { error: insertError } = await supabase.from('transactions').insert(transactionsToAdd);
        if (insertError) {
          console.error("Failed to insert scheduled transactions:", insertError.message);
          showError(`Failed to add some scheduled transactions: ${insertError.message}`);
        } else {
          console.log(`Added ${transactionsToAdd.length} scheduled transactions.`);
        }
      }

      if (updatesToMake.length > 0) {
        const updatePromises = updatesToMake.map(update =>
          supabase
            .from('scheduled_transactions')
            .update({ last_processed_date: update.last_processed_date })
            .eq('id', update.id)
        );
        await Promise.all(updatePromises);
      }

      if (transactionsToAdd.length > 0) {
        await fetchTransactions(); // Refetch transactions via react-query
      }
    } catch (error: any) {
      console.error("Error processing scheduled transactions:", error.message);
      showError(`Failed to process scheduled transactions: ${error.message}`);
      throw error;
    }
  };

  // This function is for react-query's queryFn
  const fetchScheduledTransactions = async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('scheduled_transactions')
      .select('*, recurrence_end_date') // Select recurrence_end_date
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