import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Transaction } from '@/data/finance-data';

interface ScheduledTransactionsServiceProps {
  fetchTransactions: () => Promise<void>;
  userId: string | undefined;
}

export const createScheduledTransactionsService = ({ fetchTransactions, userId }: ScheduledTransactionsServiceProps) => {

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
      const accountNames = [...new Set(scheduledTransactions.map(st => st.account))];
      const { data: accountData, error: currencyError } = await supabase
        .from('vendors')
        .select('name, accounts(currency)')
        .in('name', accountNames)
        .eq('is_account', true);
      if (currencyError) throw currencyError;

      const currencyMap = new Map<string, string>();
      accountData?.forEach(acc => {
        if (acc.accounts && acc.accounts.length > 0) {
          currencyMap.set(acc.name, acc.accounts[0].currency);
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

        // Loop to find all occurrences that should have been processed up to today
        while (nextDateToProcess <= today) {
            // Only add if this occurrence hasn't been processed yet
            if (!latestProcessedDateForThisST || nextDateToProcess > latestProcessedDateForThisST) {
                transactionsToAdd.push({
                    date: nextDateToProcess.toISOString(),
                    account: st.account,
                    vendor: st.vendor,
                    category: st.category,
                    amount: st.amount,
                    remarks: st.remarks || undefined,
                    currency: currencyMap.get(st.account) || 'USD',
                    user_id: userId,
                    is_scheduled_origin: true, // Mark as originating from a scheduled transaction
                });
                newLastProcessedDateCandidate = nextDateToProcess; // Update candidate
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
        await fetchTransactions();
      }
    } catch (error: any) {
      console.error("Error processing scheduled transactions:", error.message);
      showError(`Failed to process scheduled transactions: ${error.message}`);
    }
  };

  return {
    processScheduledTransactions,
  };
};