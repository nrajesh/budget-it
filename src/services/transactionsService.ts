import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { ensurePayeeExists, checkIfPayeeIsAccount, getAccountCurrency } from '@/integrations/supabase/utils';
import { Transaction } from '@/data/finance-data';
import { categories } from '@/data/finance-data'; // Needed for category filtering in add/update
import { useCurrency } from '@/contexts/CurrencyContext'; // Import useCurrency

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

interface TransactionsServiceProps {
  fetchTransactions: () => Promise<void>;
  refetchAllPayees: () => Promise<void>;
  transactions: Transaction[]; // To find original transaction for updates
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>; // Add setTransactions
}

export const createTransactionsService = ({ fetchTransactions, refetchAllPayees, transactions, setTransactions }: TransactionsServiceProps) => {
  const { convertBetweenCurrencies } = useCurrency(); // Use the new conversion function

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id'> & { date: string }) => {
    const newDateISO = new Date(transaction.date).toISOString();
    const baseRemarks = transaction.remarks || "";

    try {
      await ensurePayeeExists(transaction.account, true);
      const accountCurrency = await getAccountCurrency(transaction.account); // This will now always return a string

      const isTransfer = await checkIfPayeeIsAccount(transaction.vendor);
      if (isTransfer) {
        await ensurePayeeExists(transaction.vendor, true);
      } else {
        await ensurePayeeExists(transaction.vendor, false);
      }

      const commonTransactionFields = {
        ...transaction,
        currency: accountCurrency, // Set currency based on account
        date: newDateISO,
      };

      if (isTransfer) {
        const transfer_id = `transfer_${Date.now()}`;
        const newAmount = Math.abs(transaction.amount);

        // Get destination account currency for conversion
        const destinationAccountCurrency = await getAccountCurrency(transaction.vendor);
        const convertedReceivingAmount = convertBetweenCurrencies(newAmount, accountCurrency, destinationAccountCurrency);

        const debitTransaction = {
          ...commonTransactionFields,
          transfer_id: transfer_id,
          amount: -newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${transaction.vendor})` : `Transfer to ${transaction.vendor}`,
        };

        const creditTransaction = {
          ...commonTransactionFields,
          transfer_id: transfer_id,
          account: transaction.vendor,
          vendor: transaction.account,
          amount: convertedReceivingAmount, // Use converted amount for credit
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (From ${transaction.account})` : `Transfer from ${transaction.account}`,
          currency: destinationAccountCurrency, // Set currency for credit side
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
    try {
      // Get currency from the local map, assuming the account exists and its currency is known
      // No need to call ensurePayeeExists or checkIfPayeeIsAccount as the UI only allows selecting existing payees
      const accountCurrency = transactions.find(t => t.id === updatedTransaction.id)?.currency || 'USD'; // Fallback to existing currency or USD

      const newDateISO = new Date(updatedTransaction.date).toISOString();

      const { error } = await supabase.from('transactions').update({
        date: newDateISO,
        account: updatedTransaction.account,
        vendor: updatedTransaction.vendor,
        category: updatedTransaction.category,
        amount: updatedTransaction.amount,
        remarks: updatedTransaction.remarks,
        currency: accountCurrency, // Use the currency from the original transaction or a default
        transfer_id: updatedTransaction.transfer_id || null, // Keep existing transfer_id or set to null
      }).eq('id', updatedTransaction.id);

      if (error) {
        throw error;
      }

      showSuccess("Transaction updated successfully!");
      // Directly update the local state for immediate UI reflection
      setTransactions(prevTransactions =>
        prevTransactions.map(t => (t.id === updatedTransaction.id ? updatedTransaction : t))
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