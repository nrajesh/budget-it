import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Transaction } from '@/data/finance-data';

interface ScheduledTransactionsServiceProps {
  fetchTransactions: () => Promise<void>;
  userId: string | undefined;
}

export const createScheduledTransactionsService = ({ fetchTransactions, userId }: ScheduledTransactionsServiceProps) => {

  // Function to calculate the next occurrence date based on frequency
  const calculateNextOccurrence = (lastProcessedDate: string, frequency: string): string => {
    const baseDate = new Date(lastProcessedDate);
    const frequencyMatch = frequency.match(/^(\d+)([dwmy])$/);

    if (!frequencyMatch) {
      // If frequency is invalid, return the same date to prevent infinite loops
      return lastProcessedDate;
    }

    const [, numStr, unit] = frequencyMatch;
    const num = parseInt(numStr, 10);
    const newDate = new Date(baseDate);

    switch (unit) {
      case 'd': // Days
        newDate.setDate(newDate.getDate() + num);
        break;
      case 'w': // Weeks
        newDate.setDate(newDate.getDate() + num * 7);
        break;
      case 'm': // Months
        newDate.setMonth(newDate.getMonth() + num);
        break;
      case 'y': // Years
        newDate.setFullYear(newDate.getFullYear() + num);
        break;
      default:
        // Invalid unit, return same date
        return lastProcessedDate;
    }

    return newDate.toISOString();
  };

  // Function to process scheduled transactions and add them to the transactions table
  const processScheduledTransactions = async () => {
    if (!userId) {
      console.warn("User not logged in. Cannot process scheduled transactions.");
      return;
    }

    try {
      // Get all scheduled transactions for the user
      const { data: scheduledTransactions, error: fetchError } = await supabase
        .from('scheduled_transactions')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;

      if (!scheduledTransactions || scheduledTransactions.length === 0) {
        return;
      }

      const today = new Date();
      const transactionsToAdd: Omit<Transaction, 'id' | 'created_at'>[] = [];

      // Process each scheduled transaction
      for (const st of scheduledTransactions) {
        let lastProcessedDate = new Date(st.last_processed_date || st.date);
        let nextOccurrence = new Date(st.date);

        // Calculate the next occurrence date
        while (nextOccurrence <= today) {
          // Add the transaction for this occurrence
          transactionsToAdd.push({
            date: nextOccurrence.toISOString(),
            account: st.account,
            vendor: st.vendor,
            category: st.category,
            amount: st.amount,
            remarks: st.remarks || undefined,
            currency: 'USD', // Default currency, will be updated by the service
            user_id: userId,
          });

          // Update the last processed date to the current occurrence
          lastProcessedDate = new Date(nextOccurrence);

          // Calculate the next occurrence
          const nextDateStr = calculateNextOccurrence(nextOccurrence.toISOString(), st.frequency);
          nextOccurrence = new Date(nextDateStr);

          // If the next occurrence is in the future, break the loop
          if (nextOccurrence > today) {
            break;
          }
        }

        // Update the last processed date in the database
        if (lastProcessedDate > new Date(st.last_processed_date || st.date)) {
          const { error: updateError } = await supabase
            .from('scheduled_transactions')
            .update({ last_processed_date: lastProcessedDate.toISOString() })
            .eq('id', st.id);

          if (updateError) {
            console.error(`Failed to update last processed date for scheduled transaction ${st.id}:`, updateError.message);
          }
        }
      }

      // Insert all new transactions
      if (transactionsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(transactionsToAdd);

        if (insertError) {
          console.error("Failed to insert scheduled transactions:", insertError.message);
          showError(`Failed to add some scheduled transactions: ${insertError.message}`);
        } else {
          console.log(`Added ${transactionsToAdd.length} scheduled transactions.`);
          // Refresh transactions to include the new ones
          await fetchTransactions();
        }
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