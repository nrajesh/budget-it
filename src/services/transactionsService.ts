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
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>; // Add setTransactions
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency: string) => number; // Added
}

export const createTransactionsService = ({ fetchTransactions, refetchAllPayees, transactions, setTransactions, convertBetweenCurrencies }: TransactionsServiceProps) => {

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id'> & { date: string; receivingAmount?: number }) => {
    const { receivingAmount, ...restOfTransaction } = transaction; // Extract receivingAmount
    const newDateISO = new Date(restOfTransaction.date).toISOString();
    const baseRemarks = restOfTransaction.remarks || "";

    try {
      await ensurePayeeExists(restOfTransaction.account, true);
      const accountCurrency = await getAccountCurrency(restOfTransaction.account); // This will now always return a string

      const isTransfer = await checkIfPayeeIsAccount(restOfTransaction.vendor);
      if (isTransfer) {
        await ensurePayeeExists(restOfTransaction.vendor, true);
      } else {
        await ensurePayeeExists(restOfTransaction.vendor, false);
      }

      const commonTransactionFields = {
        ...restOfTransaction, // Use restOfTransaction which excludes receivingAmount
        currency: accountCurrency, // Set currency based on account
        date: newDateISO,
      };

      if (isTransfer) {
        const transfer_id = `transfer_${Date.now()}`;
        const newAmount = Math.abs(restOfTransaction.amount);

        // Get destination account currency for conversion
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
          amount: receivingAmount ?? convertedReceivingAmount, // Use user-provided receivingAmount or fallback to calculated
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (From ${restOfTransaction.account})` : `Transfer from ${restOfTransaction.account}`,
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

  const updateTransaction = async (updatedTransaction: Transaction, receivingAmount?: number) => {
    try {
      const originalTransaction = transactions.find(t => t.id === updatedTransaction.id);
      if (!originalTransaction) {
        throw new Error("Original transaction not found for update.");
      }

      const newDateISO = new Date(updatedTransaction.date).toISOString();

      if (originalTransaction.transfer_id) {
        // This is a transfer transaction
        const sendingAccountCurrency = await getAccountCurrency(updatedTransaction.account);
        const receivingAccountCurrency = await getAccountCurrency(updatedTransaction.vendor);

        const isSameCurrencyTransfer = sendingAccountCurrency === receivingAccountCurrency;

        // Find the other linked transaction
        const { data: linkedTransactions, error: fetchLinkedError } = await supabase
          .from('transactions')
          .select('*')
          .eq('transfer_id', originalTransaction.transfer_id)
          .neq('id', originalTransaction.id);

        if (fetchLinkedError) throw fetchLinkedError;
        if (!linkedTransactions || linkedTransactions.length === 0) {
          throw new Error("Linked transfer transaction not found.");
        }
        const otherTransaction = linkedTransactions[0];

        const updates: Promise<any>[] = [];

        // Update the current transaction (the one being edited)
        const currentTransactionUpdatePayload = {
          date: newDateISO,
          account: updatedTransaction.account,
          vendor: updatedTransaction.vendor,
          category: updatedTransaction.category,
          amount: updatedTransaction.amount,
          remarks: updatedTransaction.remarks,
          currency: sendingAccountCurrency, // Ensure currency is correct for sending side
        };
        updates.push(supabase.from('transactions').update(currentTransactionUpdatePayload).eq('id', updatedTransaction.id).select('*'));

        // Update the other linked transaction
        let otherTransactionAmount = 0;
        if (isSameCurrencyTransfer) {
          // For same currency, the other side is simply the negative of the current amount
          otherTransactionAmount = -updatedTransaction.amount;
        } else {
          // For cross-currency, use the provided receivingAmount or calculate
          const calculatedReceivingAmount = convertBetweenCurrencies(
            Math.abs(updatedTransaction.amount),
            sendingAccountCurrency,
            receivingAccountCurrency
          );
          otherTransactionAmount = receivingAmount ?? calculatedReceivingAmount;
        }

        const otherTransactionUpdatePayload = {
          date: newDateISO, // Date should be same for both
          account: otherTransaction.account, // Keep original account/vendor for the other side
          vendor: otherTransaction.vendor,
          category: 'Transfer', // Always 'Transfer' for linked transactions
          amount: otherTransactionAmount,
          remarks: otherTransaction.remarks, // Keep original remarks for the other side
          currency: receivingAccountCurrency, // Ensure currency is correct for receiving side
        };
        updates.push(supabase.from('transactions').update(otherTransactionUpdatePayload).eq('id', otherTransaction.id).select('*'));

        await Promise.all(updates);
        showSuccess("Transfer transactions updated successfully!");

      } else {
        // Not a transfer, proceed with single transaction update
        const { error } = await supabase.from('transactions').update({
          date: newDateISO,
          account: updatedTransaction.account,
          vendor: updatedTransaction.vendor,
          category: updatedTransaction.category,
          amount: updatedTransaction.amount,
          remarks: updatedTransaction.remarks,
          currency: updatedTransaction.currency, // Use the currency from the original transaction
          transfer_id: null,
        }).eq('id', updatedTransaction.id);

        if (error) throw error;
        showSuccess("Transaction updated successfully!");
      }

      fetchTransactions(); // Re-fetch all to ensure consistency
      refetchAllPayees(); // Re-fetch payees in case account balances changed
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