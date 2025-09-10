import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { ensurePayeeExists, checkIfPayeeIsAccount, getAccountCurrency, ensureCategoryExists } from '@/integrations/supabase/utils'; // Import ensureCategoryExists
import { Transaction } from '@/data/finance-data';

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

interface TransactionsServiceProps {
  fetchTransactions: () => Promise<void>;
  refetchAllPayees: () => Promise<void>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency: string) => number;
  userId: string | undefined; // Add userId
}

export const createTransactionsService = ({ fetchTransactions, refetchAllPayees, transactions, setTransactions, convertBetweenCurrencies, userId }: TransactionsServiceProps) => {

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id' | 'user_id' | 'is_scheduled_origin'> & { date: string; receivingAmount?: number }) => {
    if (!userId) {
      showError("User not logged in. Cannot add transaction.");
      return;
    }
    const { receivingAmount, ...restOfTransaction } = transaction;
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

      const commonTransactionFields = {
        ...restOfTransaction,
        currency: accountCurrency,
        date: newDateISO,
        user_id: userId, // This is where user_id is added
        is_scheduled_origin: false, // Manually added transactions are not from scheduled origin
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
      fetchTransactions();
      refetchAllPayees();
    } catch (error: any) {
      showError(`Failed to add transaction: ${error.message}`);
    }
  };

  const updateTransaction = async (updatedTransaction: Transaction) => {
    if (!userId) {
      showError("User not logged in. Cannot update transaction.");
      return;
    }
    try {
      // Fetch the original transaction to preserve is_scheduled_origin if not explicitly provided
      const originalTransaction = transactions.find(t => t.id === updatedTransaction.id);
      const isScheduledOrigin = originalTransaction?.is_scheduled_origin || false;

      const accountCurrency = originalTransaction?.currency || 'USD'; // Use original currency or default

      const newDateISO = new Date(updatedTransaction.date).toISOString();

      // Ensure category exists before updating
      await ensureCategoryExists(updatedTransaction.category, userId);

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
      }).eq('id', updatedTransaction.id);

      if (error) {
        throw error;
      }

      showSuccess("Transaction updated successfully!");
      setTransactions(prevTransactions =>
        prevTransactions.map(t => (t.id === updatedTransaction.id ? { ...updatedTransaction, is_scheduled_origin: isScheduledOrigin } : t))
      );
    } catch (error: any) {
      showError(`Failed to update transaction: ${error.message}`);
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
      fetchTransactions();
      refetchAllPayees();
    } catch (error: any) {
      showError(`Failed to delete transaction: ${error.message}`);
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
      fetchTransactions();
      refetchAllPayees();
    } catch (error: any) {
      showError(`Failed to delete multiple transactions: ${error.message}`);
    }
  };

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
  };
};