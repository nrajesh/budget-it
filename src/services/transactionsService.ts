import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { ensurePayeeExists, checkIfPayeeIsAccount, getAccountCurrency, ensureCategoryExists } from '@/integrations/supabase/utils';
import { Transaction } from '@/data/finance-data';
import { QueryObserverResult } from '@tanstack/react-query'; // Import QueryObserverResult

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

interface TransactionsServiceProps {
  fetchTransactions: () => Promise<QueryObserverResult<Transaction[], Error>>; // Updated return type
  refetchAllPayees: () => Promise<void>; // Updated return type
  transactions: Transaction[]; // Still needed for finding original transaction for update
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency: string) => number;
  userId: string | undefined;
}

export const createTransactionsService = ({ fetchTransactions, refetchAllPayees, transactions, convertBetweenCurrencies, userId }: TransactionsServiceProps) => {

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id' | 'user_id' | 'is_scheduled_origin'> & { date: string; receivingAmount?: number; recurrenceFrequency?: string; recurrenceEndDate?: string }) => {
    if (!userId) {
      showError("User not logged in. Cannot add transaction.");
      throw new Error("User not logged in.");
    }
    const { receivingAmount, recurrenceFrequency, recurrenceEndDate, ...restOfTransaction } = transaction;
    const newDateISO = new Date(restOfTransaction.date).toISOString();
    const baseRemarks = restOfTransaction.remarks || "";

    try {
      await ensurePayeeExists(restOfTransaction.account, true);
      const accountCurrency = await getAccountCurrency(restOfTransaction.account);

      const isTransfer = await checkIfPayeeIsAccount(restOfTransaction.vendor);
      if (isTransfer) {
        await ensurePayeeExists(restOfTransaction.vendor, true);
      } else {
        await ensurePayeeExists(restOfTransaction.vendor, false);
      }

      // Ensure category exists
      await ensureCategoryExists(restOfTransaction.category, userId);

      // Generate recurrence ID if frequency is set
      let recurrenceId: string | null = null;
      if (recurrenceFrequency && recurrenceFrequency !== 'None') {
        recurrenceId = `recurrence_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      const commonTransactionFields = {
        ...restOfTransaction,
        currency: accountCurrency,
        date: newDateISO,
        user_id: userId,
        is_scheduled_origin: false,
        recurrence_id: recurrenceId,
        recurrence_frequency: recurrenceFrequency && recurrenceFrequency !== 'None' ? recurrenceFrequency : null,
        recurrence_end_date: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
      };

      if (isTransfer) {
        const transfer_id = `transfer_${Date.now()}`;
        const newAmount = Math.abs(restOfTransaction.amount);

        const destinationAccountCurrency = await getAccountCurrency(restOfTransaction.vendor);
        const convertedReceivingAmount = convertBetweenCurrencies(newAmount, accountCurrency, destinationAccountCurrency);

        const debitTransaction = {
          ...commonTransactionFields,
          transfer_id: transfer_id,
          amount: -newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${restOfTransaction.vendor})` : `Transfer to ${restOfTransaction.vendor}`,
        };

        const creditTransaction = {
          ...commonTransactionFields,
          transfer_id: transfer_id,
          account: restOfTransaction.vendor,
          vendor: restOfTransaction.account,
          amount: receivingAmount ?? convertedReceivingAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (From ${restOfTransaction.account})` : `Transfer from ${restOfTransaction.account}`,
          currency: destinationAccountCurrency,
        };

        const { error } = await supabase.from('transactions').insert([debitTransaction, creditTransaction]);
        if (error) throw error;
        showSuccess("Transfer added successfully!");
      } else {
        const { error } = await supabase.from('transactions').insert({
          ...commonTransactionFields,
          transfer_id: null,
        });
        if (error) throw error;
        showSuccess("Transaction added successfully!");
      }
      await fetchTransactions(); // Refetch transactions via react-query
      await refetchAllPayees(); // Invalidate queries
    } catch (error: any) {
      showError(`Failed to add transaction: ${error.message}`);
      throw error;
    }
  };

  const updateTransaction = async (updatedTransaction: Transaction) => {
    if (!userId) {
      showError("User not logged in. Cannot update transaction.");
      throw new Error("User not logged in.");
    }
    try {
      // Fetch the original transaction to preserve is_scheduled_origin if not explicitly provided
      const originalTransaction = transactions.find(t => t.id === updatedTransaction.id);
      const isScheduledOrigin = originalTransaction?.is_scheduled_origin || false;

      const accountCurrency = originalTransaction?.currency || 'USD'; // Use original currency or default

      const newDateISO = new Date(updatedTransaction.date).toISOString();

      // Ensure category exists before updating
      await ensureCategoryExists(updatedTransaction.category, userId);

      // Handle recurrence fields
      let recurrenceId = updatedTransaction.recurrence_id;
      let recurrenceFrequency = updatedTransaction.recurrence_frequency;
      let recurrenceEndDate = updatedTransaction.recurrence_end_date;

      // If recurrence frequency is set to "None", clear all recurrence fields
      if (recurrenceFrequency === "None") {
        recurrenceId = null;
        recurrenceFrequency = null;
        recurrenceEndDate = null;
      }

      const { error } = await supabase.from('transactions').update({
        date: newDateISO,
        account: updatedTransaction.account,
        vendor: updatedTransaction.vendor,
        category: updatedTransaction.category,
        amount: updatedTransaction.amount,
        remarks: updatedTransaction.remarks,
        currency: accountCurrency, // Keep original account currency
        transfer_id: updatedTransaction.transfer_id || null,
        is_scheduled_origin: isScheduledOrigin, // Preserve the flag
        recurrence_id: recurrenceId,
        recurrence_frequency: recurrenceFrequency,
        recurrence_end_date: recurrenceEndDate,
      }).eq('id', updatedTransaction.id);

      if (error) {
        throw error;
      }

      showSuccess("Transaction updated successfully!");
      await fetchTransactions(); // Refetch transactions via react-query
      await refetchAllPayees(); // Invalidate queries
    } catch (error: any) {
      showError(`Failed to update transaction: ${error.message}`);
      throw error;
    }
  };

  const deleteTransaction = async (transactionId: string, transfer_id?: string) => {
    try {
      if (transfer_id) {
        const { error } = await supabase.from('transactions').delete().eq('transfer_id', transfer_id);
        if (error) throw error;
        showSuccess("Transfer deleted successfully!");
      } else {
        const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
        if (error) throw error;
        showSuccess("Transaction deleted successfully!");
      }
      await fetchTransactions(); // Refetch transactions via react-query
      await refetchAllPayees(); // Invalidate queries
    } catch (error: any) {
      showError(`Failed to delete transaction: ${error.message}`);
      throw error;
    }
  };

  const deleteMultipleTransactions = async (transactionsToDelete: TransactionToDelete[]) => {
    try {
      const idsToDelete: string[] = [];
      const transferIdsToDelete: string[] = [];

      transactionsToDelete.forEach(item => {
        idsToDelete.push(item.id);
        if (item.transfer_id) {
          transferIdsToDelete.push(item.transfer_id);
        }
      });

      if (idsToDelete.length > 0) {
        const { error: idDeleteError } = await supabase.from('transactions').delete().in('id', idsToDelete);
        if (idDeleteError) throw idDeleteError;
      }

      if (transferIdsToDelete.length > 0) {
        const uniqueTransferIds = [...new Set(transferIdsToDelete)];
        const { error: transferDeleteError } = await supabase.from('transactions').delete().in('transfer_id', uniqueTransferIds);
        if (transferDeleteError) throw transferDeleteError;
      }

      showSuccess(`${transactionsToDelete.length} transactions deleted successfully!`);
      await fetchTransactions(); // Refetch transactions via react-query
      await refetchAllPayees(); // Invalidate queries
    } catch (error: any) {
      showError(`Failed to delete multiple transactions: ${error.message}`);
      throw error;
    }
  };

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
  };
};