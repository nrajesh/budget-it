import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { ensurePayeeExists, checkIfPayeeIsAccount, getAccountCurrency } from '@/integrations/supabase/utils';
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
  convertBetweenCurrencies: (amount: number, fromCurrency: string, toCurrency:string) => number;
}

export const createTransactionsService = ({ fetchTransactions, refetchAllPayees, transactions, convertBetweenCurrencies }: TransactionsServiceProps) => {

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id'> & { date: string; receivingAmount?: number }) => {
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

      const commonTransactionFields = {
        ...restOfTransaction,
        currency: accountCurrency,
        date: newDateISO,
      };

      if (isTransfer) {
        const transfer_id = `transfer_${Date.now()}`;
        const newAmount = Math.abs(restOfTransaction.amount);
        const destinationAccountCurrency = await getAccountCurrency(restOfTransaction.vendor);
        const convertedReceivingAmount = convertBetweenCurrencies(newAmount, accountCurrency, destinationAccountCurrency);

        const debitTransaction = {
          ...commonTransactionFields,
          transfer_id,
          amount: -newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${restOfTransaction.vendor})` : `Transfer to ${restOfTransaction.vendor}`,
        };

        const creditTransaction = {
          ...commonTransactionFields,
          transfer_id,
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
        const { error } = await supabase.from('transactions').insert({ ...commonTransactionFields, transfer_id: null });
        if (error) throw error;
        showSuccess("Transaction added successfully!");
      }
      fetchTransactions();
      refetchAllPayees();
    } catch (error: any) {
      showError(`Failed to add transaction: ${error.message}`);
    }
  };

  const updateTransaction = async (updatedTransaction: Transaction, receivingAmount?: number | null) => {
    try {
      const newDateISO = new Date(updatedTransaction.date).toISOString();

      if (updatedTransaction.transfer_id) {
        // This is a transfer. The `updatedTransaction` is always the debit side.
        const { data: linkedTransactions, error: fetchLinkedError } = await supabase
          .from('transactions')
          .select('id')
          .eq('transfer_id', updatedTransaction.transfer_id)
          .neq('id', updatedTransaction.id);

        if (fetchLinkedError) throw fetchLinkedError;
        if (!linkedTransactions || linkedTransactions.length === 0) throw new Error("Linked transfer transaction not found.");
        
        const creditTxId = linkedTransactions[0].id;
        const sendingAccount = updatedTransaction.account;
        const receivingAccount = updatedTransaction.vendor;

        const sendingAccountCurrency = await getAccountCurrency(sendingAccount);
        const receivingAccountCurrency = await getAccountCurrency(receivingAccount);
        const isSameCurrencyTransfer = sendingAccountCurrency === receivingAccountCurrency;

        // Debit Payload
        const debitUpdatePayload = {
          date: newDateISO,
          account: sendingAccount,
          vendor: receivingAccount,
          category: 'Transfer',
          amount: -Math.abs(updatedTransaction.amount),
          remarks: updatedTransaction.remarks,
          currency: sendingAccountCurrency,
        };

        // Credit Payload
        let creditAmount = 0;
        if (isSameCurrencyTransfer) {
          creditAmount = Math.abs(updatedTransaction.amount);
        } else {
          const calculatedReceivingAmount = convertBetweenCurrencies(Math.abs(updatedTransaction.amount), sendingAccountCurrency, receivingAccountCurrency);
          creditAmount = (receivingAmount !== null && receivingAmount !== undefined) ? receivingAmount : calculatedReceivingAmount;
        }

        const creditUpdatePayload = {
          date: newDateISO,
          account: receivingAccount,
          vendor: sendingAccount,
          category: 'Transfer',
          amount: creditAmount,
          remarks: `Transfer from ${sendingAccount}`,
          currency: receivingAccountCurrency,
        };

        const updates = [
          supabase.from('transactions').update(debitUpdatePayload).eq('id', updatedTransaction.id),
          supabase.from('transactions').update(creditUpdatePayload).eq('id', creditTxId),
        ];

        const results = await Promise.all(updates);
        results.forEach(result => { if (result.error) throw result.error; });
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
          currency: updatedTransaction.currency,
          transfer_id: null,
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