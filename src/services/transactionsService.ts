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
}

export const createTransactionsService = ({ fetchTransactions, refetchAllPayees, transactions }: TransactionsServiceProps) => {
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
    const originalTransaction = transactions.find(t => t.id === updatedTransaction.id);
    if (!originalTransaction) {
      showError("Original transaction not found.");
      return;
    }

    const wasTransfer = !!originalTransaction.transfer_id;
    const isNowTransfer = await checkIfPayeeIsAccount(updatedTransaction.vendor);
    const newAbsoluteAmount = Math.abs(updatedTransaction.amount); // Always use absolute value from form
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
        const destinationAccountCurrency = await getAccountCurrency(updatedTransaction.vendor);
        const convertedReceivingAmount = convertBetweenCurrencies(newAbsoluteAmount, accountCurrency, destinationAccountCurrency);

        // Create new objects without the 'id' from updatedTransaction
        const { id: _, ...debitTransactionPayload } = {
          ...updatedTransaction,
          transfer_id: transfer_id,
          amount: -newAbsoluteAmount, // Debit is negative
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${updatedTransaction.vendor})` : `Transfer to ${updatedTransaction.vendor}`,
          date: newDateISO,
          currency: accountCurrency,
        };
        const { id: __, ...creditTransactionPayload } = {
          ...updatedTransaction,
          transfer_id: transfer_id,
          account: updatedTransaction.vendor,
          vendor: updatedTransaction.account,
          amount: convertedReceivingAmount, // Credit is positive, converted
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (From ${updatedTransaction.account})` : `Transfer from ${updatedTransaction.account}`,
          date: newDateISO,
          currency: destinationAccountCurrency, // Set currency for credit side
        };
        const { error: insertError } = await supabase.from('transactions').insert([debitTransactionPayload, creditTransactionPayload]);
        if (insertError) throw insertError;
        showSuccess("Transaction converted to transfer and updated successfully!");
      }
      // Case 2: Editing a transfer to become a regular transaction
      else if (wasTransfer && !isNowTransfer) {
        const { error: deleteError } = await supabase.from('transactions').delete().eq('transfer_id', originalTransaction.transfer_id);
        if (deleteError) throw deleteError;

        // Create new object without the 'id' from updatedTransaction
        const { id: _, ...newSingleTransactionPayload } = {
          ...updatedTransaction,
          transfer_id: null,
          amount: updatedTransaction.amount, // Use the amount as entered by user for regular transaction
          date: newDateISO,
          currency: accountCurrency,
        };
        const { error: insertError } = await supabase.from('transactions').insert(newSingleTransactionPayload);
        if (insertError) throw insertError;
        showSuccess("Transfer converted to transaction and updated successfully!");
      }
      // Case 3: Editing a transfer (remains a transfer)
      else if (wasTransfer && isNowTransfer) {
        const sibling = transactions.find(t => t.transfer_id === originalTransaction.transfer_id && t.id !== originalTransaction.id);
        if (!sibling) {
          throw new Error("Sibling transfer transaction not found.");
        }

        // Determine which of the two existing records (originalTransaction or sibling)
        // corresponds to the 'debit' side (updatedTransaction.account) and 'credit' side (updatedTransaction.vendor)
        let debitRecordId: string;
        let creditRecordId: string;

        // The transaction whose 'account' matches updatedTransaction.account should be the debit side
        // The transaction whose 'account' matches updatedTransaction.vendor should be the credit side
        if (originalTransaction.account === updatedTransaction.account) {
          debitRecordId = originalTransaction.id;
          creditRecordId = sibling.id;
        } else if (sibling.account === updatedTransaction.account) {
          debitRecordId = sibling.id;
          creditRecordId = originalTransaction.id;
        } else {
          throw new Error("Could not map updated account to existing transfer records.");
        }

        const newDebitAccount = updatedTransaction.account;
        const newCreditAccount = updatedTransaction.vendor;
        const transfer_id = originalTransaction.transfer_id; // Explicitly carry over transfer_id

        const destinationAccountCurrency = await getAccountCurrency(newCreditAccount);
        const convertedReceivingAmount = convertBetweenCurrencies(newAbsoluteAmount, accountCurrency, destinationAccountCurrency);

        const newDebitData = {
          date: newDateISO,
          account: newDebitAccount,
          vendor: newCreditAccount,
          amount: -newAbsoluteAmount, // Debit is negative
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${newCreditAccount})` : `Transfer to ${newCreditAccount}`,
          currency: accountCurrency,
          transfer_id: transfer_id,
        };

        const newCreditData = {
          date: newDateISO,
          account: newCreditAccount,
          vendor: newDebitAccount,
          amount: convertedReceivingAmount, // Credit is positive, converted
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (From ${newDebitAccount})` : `Transfer from ${newDebitAccount}`,
          currency: destinationAccountCurrency, // Set currency for credit side
          transfer_id: transfer_id,
        };

        const { error: debitError } = await supabase.from('transactions').update(newDebitData).eq('id', debitRecordId);
        if (debitError) throw debitError;
        const { error: creditError } = await supabase.from('transactions').update(newCreditData).eq('id', creditRecordId);
        if (creditError) throw creditError;
        showSuccess("Transfer updated successfully!");
      }
      // Case 4: Editing a regular transaction (remains regular)
      else {
        const { error } = await supabase.from('transactions').update({
          ...updatedTransaction,
          date: newDateISO,
          transfer_id: null,
          currency: accountCurrency,
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