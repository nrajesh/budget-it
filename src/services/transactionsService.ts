import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { ensurePayeeExists, checkIfPayeeIsAccount, getAccountCurrency } from '@/integrations/supabase/utils';
import { Transaction } from '@/data/finance-data';
import { categories } from '@/data/finance-data'; // Needed for category filtering in add/update

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

interface TransactionsServiceProps {
  fetchTransactions: () => Promise<void>;
  refetchAllPayees: () => Promise<void>;
  transactions: Transaction[]; // To find original transaction for updates
}

export const createTransactionsService = ({ fetchTransactions, refetchAllPayees, transactions }: TransactionsServiceProps) => {

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
          amount: newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (From ${transaction.account})` : `Transfer from ${transaction.account}`,
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
    const originalTransaction = transactions.find(t => t.id === updatedTransaction.id);
    if (!originalTransaction) {
      showError("Original transaction not found.");
      return;
    }

    const wasTransfer = !!originalTransaction.transfer_id;
    const isNowTransfer = await checkIfPayeeIsAccount(updatedTransaction.vendor);
    const newAmount = Math.abs(updatedTransaction.amount);
    const newDateISO = new Date(updatedTransaction.date).toISOString();
    const baseRemarks = updatedTransaction.remarks?.split(" (From ")[0].split(" (To ")[0] || "";

    try {
      await ensurePayeeExists(updatedTransaction.account, true);
      const accountCurrency = await getAccountCurrency(updatedTransaction.account); // This will now always return a string

      if (isNowTransfer) {
        await ensurePayeeExists(updatedTransaction.vendor, true);
      } else {
        await ensurePayeeExists(updatedTransaction.vendor, false);
      }

      // Case 1: Editing a regular transaction to become a transfer
      if (!wasTransfer && isNowTransfer) {
        const { error: deleteError } = await supabase.from('transactions').delete().eq('id', originalTransaction.id);
        if (deleteError) throw deleteError;

        const transfer_id = `transfer_${Date.now()}`;
        const debitTransaction = {
          ...updatedTransaction,
          transfer_id: transfer_id,
          amount: -newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${updatedTransaction.vendor})` : `Transfer to ${updatedTransaction.vendor}`,
          date: newDateISO,
          currency: accountCurrency, // Set currency based on account
        };
        const creditTransaction = {
          ...updatedTransaction,
          transfer_id: transfer_id,
          account: updatedTransaction.vendor,
          vendor: updatedTransaction.account,
          amount: newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${(baseRemarks as string).replace(`(To ${updatedTransaction.vendor})`, `(From ${updatedTransaction.account})`)}` : `Transfer from ${updatedTransaction.account}`,
          date: newDateISO,
          currency: accountCurrency, // Set currency based on account
        };
        const { error: insertError } = await supabase.from('transactions').insert([debitTransaction, creditTransaction]);
        if (insertError) throw insertError;
        showSuccess("Transaction converted to transfer and updated successfully!");
      }
      // Case 2: Editing a transfer to become a regular transaction
      else if (wasTransfer && !isNowTransfer) {
        const { error: deleteError } = await supabase.from('transactions').delete().eq('transfer_id', originalTransaction.transfer_id);
        if (deleteError) throw deleteError;

        const newSingleTransaction = {
          ...updatedTransaction,
          transfer_id: null,
          amount: -newAmount,
          date: newDateISO,
          currency: accountCurrency, // Set currency based on account
        };
        const { error: insertError } = await supabase.from('transactions').insert(newSingleTransaction);
        if (insertError) throw insertError;
        showSuccess("Transfer converted to transaction and updated successfully!");
      }
      // Case 3: Editing a transfer (remains a transfer)
      else if (wasTransfer && isNowTransfer) {
        const sibling = transactions.find(t => t.transfer_id === originalTransaction.transfer_id && t.id !== originalTransaction.id);
        if (!sibling) {
          throw new Error("Sibling transfer transaction not found.");
        }

        const oldDebitId = originalTransaction.amount < 0 ? originalTransaction.id : sibling.id;
        const oldCreditId = originalTransaction.amount < 0 ? sibling.id : originalTransaction.id;

        const newDebitAccount = updatedTransaction.account;
        const newCreditAccount = updatedTransaction.vendor;

        const newDebitData = {
          date: newDateISO,
          account: newDebitAccount,
          vendor: newCreditAccount,
          amount: -newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${newCreditAccount})` : `Transfer to ${newCreditAccount}`,
          currency: accountCurrency, // Set currency based on account
        };

        const newCreditData = {
          date: newDateISO,
          account: newCreditAccount,
          vendor: newDebitAccount,
          amount: newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${(baseRemarks as string).replace(`(To ${newCreditAccount})`, `(From ${newDebitAccount})`)}` : `Transfer from ${newDebitAccount}`,
          currency: accountCurrency, // Set currency based on account
        };

        const { error: debitError } = await supabase.from('transactions').update(newDebitData).eq('id', oldDebitId);
        if (debitError) throw debitError;
        const { error: creditError } = await supabase.from('transactions').update(newCreditData).eq('id', oldCreditId);
        if (creditError) throw creditError;
        showSuccess("Transfer updated successfully!");
      }
      // Case 4: Editing a regular transaction (remains regular)
      else {
        const { error } = await supabase.from('transactions').update({
          ...updatedTransaction,
          date: newDateISO,
          transfer_id: null,
          currency: accountCurrency, // Set currency based on account
        }).eq('id', updatedTransaction.id);
        if (error) throw error;
        showSuccess("Transaction updated successfully!");
      }
      fetchTransactions();
      refetchAllPayees();
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