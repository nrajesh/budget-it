import * as React from 'react';
import { Transaction, accounts, vendors, categories } from '@/data/finance-data';
import { useCurrency } from './CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transferId'> & { date: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string, transferId?: string) => void;
  clearAllTransactions: () => void;
  generateDiverseDemoData: () => void;
}

const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

// Helper function to generate sample transactions for a given month, account, and currency
const generateTransactions = (
  monthOffset: number,
  count: number,
  accountNames: string[],
  currencyCodes: string[],
): Omit<Transaction, 'id' | 'created_at'>[] => {
  const sampleTransactions: Omit<Transaction, 'id' | 'created_at'>[] = [];
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const endOfTargetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);

  for (let i = 0; i < count; i++) {
    const randomDay = Math.floor(Math.random() * (endOfTargetMonth.getDate() - targetMonth.getDate() + 1)) + targetMonth.getDate();
    const date = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), randomDay);

    const isTransfer = Math.random() < 0.2;
    const accountName = accountNames[Math.floor(Math.random() * accountNames.length)];
    const currencyCode = currencyCodes[Math.floor(Math.random() * currencyCodes.length)];

    let vendorName = vendors[Math.floor(Math.random() * vendors.length)];
    let categoryName = categories[Math.floor(Math.random() * categories.length)];
    let amountValue = parseFloat((Math.random() * 200 + 10).toFixed(2));

    if (isTransfer) {
      let destAccount = accountNames[Math.floor(Math.random() * accountNames.length)];
      while (destAccount === accountName) {
        destAccount = accountNames[Math.floor(Math.random() * accountNames.length)];
      }
      vendorName = destAccount;
      categoryName = 'Transfer';
      amountValue = Math.abs(amountValue);
    } else {
      if (Math.random() < 0.6 && categoryName !== 'Salary') {
        amountValue = -amountValue;
      } else if (categoryName === 'Salary') {
        amountValue = Math.abs(amountValue) * 5;
      }
    }

    const baseTransactionDetails: Omit<Transaction, 'id' | 'created_at' | 'transferId'> = {
      date: date.toISOString(),
      account: accountName,
      currency: currencyCode,
      vendor: vendorName,
      amount: amountValue,
      remarks: Math.random() > 0.7 ? `Sample remark ${i + 1}` : undefined,
      category: categoryName,
    };

    if (isTransfer) {
      const transferId = `transfer_${Date.now()}_${i}_${monthOffset}_${accountName.replace(/\s/g, '')}`;
      const debitTransaction: Omit<Transaction, 'id' | 'created_at'> = {
        ...baseTransactionDetails,
        transferId,
        amount: -Math.abs(baseTransactionDetails.amount),
        category: 'Transfer',
        remarks: baseTransactionDetails.remarks ? `${baseTransactionDetails.remarks} (To ${baseTransactionDetails.vendor})` : `Transfer to ${baseTransactionDetails.vendor}`,
      };
      sampleTransactions.push(debitTransaction);

      const creditTransaction: Omit<Transaction, 'id' | 'created_at'> = {
        ...baseTransactionDetails,
        transferId,
        account: baseTransactionDetails.vendor,
        vendor: baseTransactionDetails.account,
        amount: Math.abs(baseTransactionDetails.amount),
        category: 'Transfer',
        remarks: baseTransactionDetails.remarks ? `${(baseTransactionDetails.remarks as string).replace(`(To ${baseTransactionDetails.vendor})`, `(From ${baseTransactionDetails.account})`)}` : `Transfer from ${baseTransactionDetails.account}`,
      };
      sampleTransactions.push(creditTransaction);
    } else {
      const singleTransaction: Omit<Transaction, 'id' | 'created_at'> = {
        ...baseTransactionDetails,
      };
      sampleTransactions.push(singleTransaction);
    }
  }
  return sampleTransactions;
};

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { availableCurrencies } = useCurrency();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      showError(`Failed to fetch transactions: ${error.message}`);
      setTransactions([]);
    } else {
      setTransactions(data as Transaction[]);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transferId'> & { date: string }) => {
    const isTransfer = accounts.includes(transaction.vendor);
    const baseTransactionData = {
      ...transaction,
      currency: 'USD', // Default to USD for new manual transactions
      date: new Date(transaction.date).toISOString(),
    };

    try {
      if (isTransfer) {
        const transferId = `transfer_${Date.now()}`;
        const newAmount = Math.abs(transaction.amount);
        const baseRemarks = transaction.remarks || "";

        const debitTransaction = {
          ...baseTransactionData,
          transfer_id: transferId,
          amount: -newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${transaction.vendor})` : `Transfer to ${transaction.vendor}`,
        };

        const creditTransaction = {
          ...baseTransactionData,
          transfer_id: transferId,
          account: transaction.vendor,
          vendor: transaction.account,
          amount: newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${(baseRemarks as string).replace(`(To ${transaction.vendor})`, `(From ${transaction.account})`)}` : `Transfer from ${transaction.account}`,
        };

        const { error } = await supabase.from('transactions').insert([debitTransaction, creditTransaction]);
        if (error) throw error;
        showSuccess("Transfer added successfully!");
      } else {
        const { error } = await supabase.from('transactions').insert(baseTransactionData);
        if (error) throw error;
        showSuccess("Transaction added successfully!");
      }
      fetchTransactions(); // Re-fetch to update local state with new data from DB
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

    const wasTransfer = !!originalTransaction.transferId;
    const isNowTransfer = accounts.includes(updatedTransaction.vendor);
    const newAmount = Math.abs(updatedTransaction.amount);
    const baseRemarks = updatedTransaction.remarks?.split(" (From ")[0].split(" (To ")[0] || "";

    try {
      // Case 1: Editing a regular transaction to become a transfer
      if (!wasTransfer && isNowTransfer) {
        // Delete original transaction
        const { error: deleteError } = await supabase.from('transactions').delete().eq('id', originalTransaction.id);
        if (deleteError) throw deleteError;

        // Insert new transfer transactions
        const transferId = `transfer_${Date.now()}`;
        const debitTransaction = {
          ...updatedTransaction,
          transfer_id: transferId,
          amount: -newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${updatedTransaction.vendor})` : `Transfer to ${updatedTransaction.vendor}`,
          date: new Date(updatedTransaction.date).toISOString(),
        };
        const creditTransaction = {
          ...updatedTransaction,
          transfer_id: transferId,
          account: updatedTransaction.vendor,
          vendor: updatedTransaction.account,
          amount: newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (From ${updatedTransaction.account})` : `Transfer from ${updatedTransaction.account}`,
          date: new Date(updatedTransaction.date).toISOString(),
        };
        const { error: insertError } = await supabase.from('transactions').insert([debitTransaction, creditTransaction]);
        if (insertError) throw insertError;
        showSuccess("Transaction converted to transfer and updated successfully!");
      }
      // Case 2: Editing a transfer to become a regular transaction
      else if (wasTransfer && !isNowTransfer) {
        // Delete both transfer transactions
        const { error: deleteError } = await supabase.from('transactions').delete().eq('transfer_id', originalTransaction.transferId);
        if (deleteError) throw deleteError;

        // Insert new regular transaction
        const newSingleTransaction = {
          ...updatedTransaction,
          transfer_id: null, // Ensure transfer_id is null
          amount: -newAmount, // Assuming regular transactions are expenses by default when converting from transfer
          date: new Date(updatedTransaction.date).toISOString(),
        };
        const { error: insertError } = await supabase.from('transactions').insert(newSingleTransaction);
        if (insertError) throw insertError;
        showSuccess("Transfer converted to transaction and updated successfully!");
      }
      // Case 3: Editing a transfer (remains a transfer)
      else if (wasTransfer && isNowTransfer) {
        const sibling = transactions.find(t => t.transferId === originalTransaction.transferId && t.id !== originalTransaction.id);
        if (!sibling) {
          throw new Error("Sibling transfer transaction not found.");
        }

        const oldDebitId = originalTransaction.amount < 0 ? originalTransaction.id : sibling.id;
        const oldCreditId = originalTransaction.amount < 0 ? sibling.id : originalTransaction.id;

        const newDate = new Date(updatedTransaction.date).toISOString();
        const newDebitAccount = updatedTransaction.account;
        const newCreditAccount = updatedTransaction.vendor;

        const newDebitData = {
          date: newDate,
          account: newDebitAccount,
          vendor: newCreditAccount,
          amount: -newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${newCreditAccount})` : `Transfer to ${newCreditAccount}`,
        };

        const newCreditData = {
          date: newDate,
          account: newCreditAccount,
          vendor: newDebitAccount,
          amount: newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (From ${newDebitAccount})` : `Transfer from ${newDebitAccount}`,
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
          date: new Date(updatedTransaction.date).toISOString(),
          transfer_id: null, // Ensure transfer_id is null for regular transactions
        }).eq('id', updatedTransaction.id);
        if (error) throw error;
        showSuccess("Transaction updated successfully!");
      }
      fetchTransactions();
    } catch (error: any) {
      showError(`Failed to update transaction: ${error.message}`);
    }
  };

  const deleteTransaction = async (transactionId: string, transferId?: string) => {
    try {
      if (transferId) {
        const { error } = await supabase.from('transactions').delete().eq('transfer_id', transferId);
        if (error) throw error;
        showSuccess("Transfer deleted successfully!");
      } else {
        const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
        if (error) throw error;
        showSuccess("Transaction deleted successfully!");
      }
      fetchTransactions();
    } catch (error: any) {
      showError(`Failed to delete transaction: ${error.message}`);
    }
  };

  const clearAllTransactions = React.useCallback(async () => {
    try {
      const { error } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      if (error) throw error;
      setTransactions([]);
      showSuccess("All transactions cleared successfully!");
    } catch (error: any) {
      showError(`Failed to clear transactions: ${error.message}`);
    }
  }, []);

  const generateDiverseDemoData = React.useCallback(async () => {
    try {
      // Clear existing data first
      await clearAllTransactions();

      const accountsToUse = accounts;
      const currenciesToUse = availableCurrencies.slice(0, 3).map(c => c.code);

      const demoData: Omit<Transaction, 'id' | 'created_at'>[] = [];
      demoData.push(...generateTransactions(0, 300, accountsToUse, currenciesToUse));
      demoData.push(...generateTransactions(-1, 300, accountsToUse, currenciesToUse));
      demoData.push(...generateTransactions(-2, 300, accountsToUse, currenciesToUse));

      const { error } = await supabase.from('transactions').insert(demoData);
      if (error) throw error;
      showSuccess("Diverse demo data generated successfully!");
      fetchTransactions();
    } catch (error: any) {
      showError(`Failed to generate demo data: ${error.message}`);
    }
  }, [availableCurrencies, clearAllTransactions, fetchTransactions]);

  const value = React.useMemo(() => ({
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    generateDiverseDemoData,
  }), [transactions, addTransaction, updateTransaction, deleteTransaction, clearAllTransactions, generateDiverseDemoData]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading transactions...</div>;
  }

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => {
  const context = React.useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};