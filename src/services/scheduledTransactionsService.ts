import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Transaction } from '@/data/finance-data';
import { QueryObserverResult } from '@tanstack/react-query';
import { getAccountCurrency } from '@/integrations/supabase/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

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
  const { convertBetweenCurrencies } = useCurrency();

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
    console.log("--- Starting processScheduledTransactions ---");
    if (!userId) {
      console.warn("User not logged in. Cannot process scheduled transactions.");
      return;
    }
    console.log("Processing scheduled transactions for user:", userId);

    try {
      const { data: scheduledTransactions, error: fetchError } = await supabase
        .from('scheduled_transactions')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;
      if (!scheduledTransactions || scheduledTransactions.length === 0) {
        console.log("No scheduled transactions found for user:", userId);
        return;
      }
      console.log("Fetched scheduled transactions:", scheduledTransactions.length);

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
      console.log("Populated Currency Map:", Object.fromEntries(currencyMap));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const transactionsToAdd: Omit<Transaction, 'id' | 'created_at'>[] = [];
      const updatesToMake: { id: string; last_processed_date: string }[] = [];

      for (const st of scheduledTransactions) {
        console.log("\n--- Processing scheduled transaction:", st.id, "---");
        console.log("Scheduled Transaction Details:", st);

        let nextDateToProcess = new Date(st.date);
        nextDateToProcess.setHours(0, 0, 0, 0);

        let latestProcessedDateForThisST = st.last_processed_date ? new Date(st.last_processed_date) : null;
        if (latestProcessedDateForThisST) {
            latestProcessedDateForThisST.setHours(0, 0, 0, 0);
        }
        console.log("Initial nextDateToProcess (from st.date):", nextDateToProcess.toISOString());
        console.log("Latest Processed Date for this ST (from DB):", latestProcessedDateForThisST?.toISOString());

        let newLastProcessedDateCandidate = latestProcessedDateForThisST;

        const recurrenceEndDate = st.recurrence_end_date ? new Date(st.recurrence_end_date) : null;
        if (recurrenceEndDate) recurrenceEndDate.setHours(23, 59, 59, 999);
        console.log("Recurrence End Date:", recurrenceEndDate?.toISOString() || "None");

        while (nextDateToProcess <= today) {
            console.log("Checking occurrence for date:", nextDateToProcess.toISOString());
            if (recurrenceEndDate && nextDateToProcess > recurrenceEndDate) {
                console.log("Recurrence end date reached for:", st.id, "Breaking loop.");
                break;
            }

            if (!latestProcessedDateForThisST || nextDateToProcess > latestProcessedDateForThisST) {
                console.log("Adding new occurrence for:", st.id, "on date:", nextDateToProcess.toISOString());
                const baseTransactionFields = {
                    date: nextDateToProcess.toISOString(),
                    account: st.account,
                    vendor: st.vendor,
                    category: st.category,
                    amount: st.amount,
                    remarks: st.remarks || undefined,
                    currency: currencyMap.get(st.account) || 'USD', // Default to USD if not found
                    user_id: userId,
                    is_scheduled_origin: true,
                };
                console.log("Base Transaction Fields (before transfer logic):", baseTransactionFields);

                if (st.category === 'Transfer') {
                    console.log("Scheduled transaction is a 'Transfer'. Generating two entries.");
                    const transfer_id = `transfer_scheduled_${st.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                    const newAmount = Math.abs(st.amount);

                    const sourceAccountCurrency = currencyMap.get(st.account) || 'USD';
                    const destinationAccountCurrency = currencyMap.get(st.vendor) || 'USD';

                    console.log("Source Account Currency:", sourceAccountCurrency);
                    console.log("Destination Account Currency:", destinationAccountCurrency);
                    console.log("Original Amount:", newAmount);

                    const convertedReceivingAmount = convertBetweenCurrencies(
                      newAmount,
                      sourceAccountCurrency,
                      destinationAccountCurrency
                    );
                    console.log("Converted Receiving Amount:", convertedReceivingAmount);

                    // Debit transaction (from source account)
                    const debitTransaction = {
                        ...baseTransactionFields,
                        transfer_id: transfer_id,
                        amount: -newAmount,
                        remarks: baseTransactionFields.remarks ? `${baseTransactionFields.remarks} (To ${st.vendor})` : `Transfer to ${st.vendor}`,
                    };
                    transactionsToAdd.push(debitTransaction);
                    console.log("Pushed Debit Transaction:", debitTransaction);

                    // Credit transaction (to destination account)
                    const creditTransaction = {
                        ...baseTransactionFields,
                        transfer_id: transfer_id,
                        account: st.vendor, // Destination account
                        vendor: st.account, // Source account
                        amount: convertedReceivingAmount,
                        remarks: baseTransactionFields.remarks ? `${baseTransactionFields.remarks} (From ${st.account})` : `Transfer from ${st.account}`,
                        currency: destinationAccountCurrency,
                    };
                    transactionsToAdd.push(creditTransaction);
                    console.log("Pushed Credit Transaction:", creditTransaction);

                } else {
                    console.log("Scheduled transaction is NOT a 'Transfer'. Generating single entry.");
                    transactionsToAdd.push(baseTransactionFields);
                    console.log("Pushed Single Transaction:", baseTransactionFields);
                }
                newLastProcessedDateCandidate = nextDateToProcess;
            } else {
                console.log("Occurrence already processed for:", st.id, "on date:", nextDateToProcess.toISOString(), "Skipping.");
            }
            nextDateToProcess = new Date(calculateNextOccurrence(nextDateToProcess.toISOString(), st.frequency));
            nextDateToProcess.setHours(0, 0, 0, 0);
            console.log("Next date to check in loop:", nextDateToProcess.toISOString());
        }

        if (newLastProcessedDateCandidate && (!latestProcessedDateForThisST || newLastProcessedDateCandidate > latestProcessedDateForThisST)) {
            updatesToMake.push({
                id: st.id,
                last_processed_date: newLastProcessedDateCandidate.toISOString(),
            });
            console.log("Scheduled transaction", st.id, "will be updated with last_processed_date:", newLastProcessedDateCandidate.toISOString());
        }
      }

      if (transactionsToAdd.length > 0) {
        console.log("\n--- Attempting to insert transactions into Supabase ---");
        console.log("Transactions to insert:", transactionsToAdd);
        const { error: insertError } = await supabase.from('transactions').insert(transactionsToAdd);
        if (insertError) {
          console.error("Failed to insert scheduled transactions:", insertError.message);
          showError(`Failed to add some scheduled transactions: ${insertError.message}`);
        } else {
          console.log(`Successfully added ${transactionsToAdd.length} scheduled transactions.`);
        }
      } else {
        console.log("No new transactions to add.");
      }

      if (updatesToMake.length > 0) {
        console.log("\n--- Attempting to update scheduled transactions in Supabase ---");
        console.log("Updates to make:", updatesToMake);
        const updatePromises = updatesToMake.map(update =>
          supabase
            .from('scheduled_transactions')
            .update({ last_processed_date: update.last_processed_date })
            .eq('id', update.id)
        );
        await Promise.all(updatePromises);
        console.log(`Successfully updated ${updatesToMake.length} scheduled transactions.`);
      } else {
        console.log("No scheduled transactions to update.");
      }

      if (transactionsToAdd.length > 0) {
        await fetchTransactions();
        console.log("Refetched main transactions after processing scheduled ones.");
      }
      console.log("--- Finished processScheduledTransactions ---");
    } catch (error: any) {
      console.error("Error processing scheduled transactions:", error.message);
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