import * as React from 'react';
import { Transaction, categories } from '@/data/finance-data'; // Removed 'accounts' and 'vendors' from here
import { useCurrency } from './CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { ensurePayeeExists, checkIfPayeeIsAccount } from '@/integrations/supabase/utils'; // New imports

interface TransactionToDelete {
  id: string;
  transfer_id?: string;
}

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id'> & { date: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string, transfer_id?: string) => void;
  deleteMultipleTransactions: (transactionsToDelete: TransactionToDelete[]) => void;
  clearAllTransactions: () => void;
  generateDiverseDemoData: () => void;
}

const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

// Helper function to generate sample transactions for a given month, account, and currency
const generateTransactions = async ( // Made async
  monthOffset: number,
  count: number,
  baseAccountNames: string[], // These are potential names for accounts
  baseVendorNames: string[], // These are potential names for regular vendors
  currencyCodes: string[],
): Promise<Omit<Transaction, 'id' | 'created_at'>[]> => {
  const sampleTransactions: Omit<Transaction, 'id' | 'created_at'>[] = [];
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const endOfTargetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);

  for (let i = 0; i < count; i++) {
    const randomDay = Math.floor(Math.random() * (endOfTargetMonth.getDate() - targetMonth.getDate() + 1)) + targetMonth.getDate();
    const date = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), randomDay);

    const isTransfer = Math.random() < 0.2;
    const accountName = baseAccountNames[Math.floor(Math.random() * baseAccountNames.length)];
    
    const currencyCode = currencyCodes.length > 0 
      ? currencyCodes[Math.floor(Math.random() * currencyCodes.length)] 
      : 'USD'; 

    let vendorName = baseVendorNames[Math.floor(Math.random() * baseVendorNames.length)];
    let categoryName = categories[Math.floor(Math.random() * categories.length)];
    let amountValue = parseFloat((Math.random() * 200 + 10).toFixed(2));

    console.log(`--- [generateTransactions] Generating transaction ${i + 1} for month offset ${monthOffset} ---`);
    console.log(`[generateTransactions]   Initial: Account: "${accountName}", Vendor: "${vendorName}", Category: "${categoryName}", Amount: ${amountValue}, Currency: ${currencyCode}, IsTransfer: ${isTransfer}`);

    // Ensure the primary account exists in the database
    const primaryAccountId = await ensurePayeeExists(accountName, true);
    if (!primaryAccountId) {
      console.error(`[generateTransactions] Failed to ensure primary account "${accountName}" exists. Skipping transaction.`);
      continue; // Skip this transaction if primary account creation/lookup fails
    }

    if (isTransfer) {
      let destAccount = baseAccountNames[Math.floor(Math.random() * baseAccountNames.length)];
      while (destAccount === accountName) {
        destAccount = baseAccountNames[Math.floor(Math.random() * baseAccountNames.length)];
      }
      vendorName = destAccount; // Vendor is actually another account for a transfer
      categoryName = 'Transfer';
      amountValue = Math.abs(amountValue);

      // Ensure the destination account exists in the database
      const destAccountId = await ensurePayeeExists(destAccount, true);
      if (!destAccountId) {
        console.error(`[generateTransactions] Failed to ensure destination account "${destAccount}" exists. Skipping transfer.`);
        continue; // Skip this transaction if destination account creation/lookup fails
      }

    } else {
      if (Math.random() < 0.6 && categoryName !== 'Salary') {
        amountValue = -amountValue;
      } else if (categoryName === 'Salary') {
        amountValue = Math.abs(amountValue) * 5;
      }
      // Ensure the regular vendor exists in the database
      const regularVendorId = await ensurePayeeExists(vendorName, false);
      if (!regularVendorId) {
        console.error(`[generateTransactions] Failed to ensure regular vendor "${vendorName}" exists. Skipping transaction.`);
        continue; // Skip this transaction if regular vendor creation/lookup fails
      }
    }

    const baseTransactionDetails: Omit<Transaction, 'id' | 'created_at' | 'transfer_id'> = {
      date: date.toISOString(),
      account: accountName,
      currency: currencyCode,
      vendor: vendorName,
      amount: amountValue,
      remarks: Math.random() > 0.7 ? `Sample remark ${i + 1}` : undefined,
      category: categoryName,
    };

    if (isTransfer) {
      const transfer_id = `transfer_${Date.now()}_${i}_${monthOffset}_${accountName.replace(/\s/g, '')}`;
      const debitTransaction: Omit<Transaction, 'id' | 'created_at'> = {
        ...baseTransactionDetails,
        transfer_id,
        amount: -Math.abs(baseTransactionDetails.amount),
        category: 'Transfer',
        remarks: baseTransactionDetails.remarks ? `${baseTransactionDetails.remarks} (To ${baseTransactionDetails.vendor})` : `Transfer to ${baseTransactionDetails.vendor}`,
      };
      sampleTransactions.push(debitTransaction);
      console.log(`[generateTransactions]   Added debit transfer: ${JSON.stringify(debitTransaction)}`);

      const creditTransaction: Omit<Transaction, 'id' | 'created_at'> = {
        ...baseTransactionDetails,
        transfer_id,
        account: baseTransactionDetails.vendor,
        vendor: baseTransactionDetails.account,
        amount: Math.abs(baseTransactionDetails.amount),
        category: 'Transfer',
        remarks: baseTransactionDetails.remarks ? `${(baseTransactionDetails.remarks as string).replace(`(To ${baseTransactionDetails.vendor})`, `(From ${baseTransactionDetails.account})`)}` : `Transfer from ${baseTransactionDetails.account}`,
      };
      sampleTransactions.push(creditTransaction);
      console.log(`[generateTransactions]   Added credit transfer: ${JSON.stringify(creditTransaction)}`);
    } else {
      const singleTransaction: Omit<Transaction, 'id' | 'created_at'> = {
        ...baseTransactionDetails,
      };
      sampleTransactions.push(singleTransaction);
      console.log(`[generateTransactions]   Added single transaction: ${JSON.stringify(singleTransaction)}`);
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

  const addTransaction = React.useCallback(async (transaction: Omit<Transaction, 'id' | 'currency' | 'created_at' | 'transfer_id'> & { date: string }) => {
    const newDateISO = new Date(transaction.date).toISOString();
    const baseRemarks = transaction.remarks || "";

    try {
      // Ensure the primary account exists and is marked as an account
      await ensurePayeeExists(transaction.account, true);

      const isTransfer = await checkIfPayeeIsAccount(transaction.vendor); // Dynamically check if vendor is an account
      if (isTransfer) {
        // Ensure the destination account exists and is marked as an account
        await ensurePayeeExists(transaction.vendor, true);
      } else {
        // Ensure the vendor exists as a regular vendor
        await ensurePayeeExists(transaction.vendor, false);
      }

      const commonTransactionFields = {
        ...transaction,
        currency: 'USD', // Default to USD for new manual transactions
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
          transfer_id: null, // Ensure transfer_id is null for regular transactions
        });
        if (error) throw error;
        showSuccess("Transaction added successfully!");
      }
      fetchTransactions();
    } catch (error: any) {
      showError(`Failed to add transaction: ${error.message}`);
    }
  }, [fetchTransactions]);

  const updateTransaction = React.useCallback(async (updatedTransaction: Transaction) => {
    const originalTransaction = transactions.find(t => t.id === updatedTransaction.id);
    if (!originalTransaction) {
      showError("Original transaction not found.");
      return;
    }

    const wasTransfer = !!originalTransaction.transfer_id;
    const isNowTransfer = await checkIfPayeeIsAccount(updatedTransaction.vendor); // Dynamically check if new vendor is an account
    const newAmount = Math.abs(updatedTransaction.amount);
    const newDateISO = new Date(updatedTransaction.date).toISOString();
    const baseRemarks = updatedTransaction.remarks?.split(" (From ")[0].split(" (To ")[0] || "";

    try {
      // Ensure the primary account exists and is marked as an account
      await ensurePayeeExists(updatedTransaction.account, true);

      if (isNowTransfer) {
        // Ensure the new vendor (destination account) exists and is marked as an account
        await ensurePayeeExists(updatedTransaction.vendor, true);
      } else {
        // Ensure the new vendor exists as a regular vendor
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
        };
        const creditTransaction = {
          ...updatedTransaction,
          transfer_id: transfer_id,
          account: updatedTransaction.vendor,
          vendor: updatedTransaction.account,
          amount: newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (From ${updatedTransaction.account})` : `Transfer from ${updatedTransaction.account}`,
          date: newDateISO,
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
          amount: -newAmount, // Assuming regular transactions are expenses by default when converting from transfer
          date: newDateISO,
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
        };

        const newCreditData = {
          date: newDateISO,
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
          date: newDateISO,
          transfer_id: null,
        }).eq('id', updatedTransaction.id);
        if (error) throw error;
        showSuccess("Transaction updated successfully!");
      }
      fetchTransactions();
    } catch (error: any) {
      showError(`Failed to update transaction: ${error.message}`);
    }
  }, [transactions, fetchTransactions]);

  const deleteTransaction = React.useCallback(async (transactionId: string, transfer_id?: string) => {
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
    } catch (error: any) {
      showError(`Failed to delete transaction: ${error.message}`);
    }
  }, [fetchTransactions]);

  const deleteMultipleTransactions = React.useCallback(async (transactionsToDelete: TransactionToDelete[]) => {
    try {
      const idsToDelete: string[] = [];
      const transferIdsToDelete: string[] = [];

      transactionsToDelete.forEach(item => {
        idsToDelete.push(item.id);
        if (item.transfer_id) {
          transferIdsToDelete.push(item.transfer_id);
        }
      });

      // Delete all transactions by their IDs
      if (idsToDelete.length > 0) {
        const { error: idDeleteError } = await supabase.from('transactions').delete().in('id', idsToDelete);
        if (idDeleteError) throw idDeleteError;
      }

      // Delete all associated transfer transactions by their transfer_ids
      // This handles cases where only one side of a transfer was selected
      if (transferIdsToDelete.length > 0) {
        const uniqueTransferIds = [...new Set(transferIdsToDelete)];
        const { error: transferDeleteError } = await supabase.from('transactions').delete().in('transfer_id', uniqueTransferIds);
        if (transferDeleteError) throw transferDeleteError;
      }

      showSuccess(`${transactionsToDelete.length} transactions deleted successfully!`);
      fetchTransactions();
    } catch (error: any) {
      showError(`Failed to delete multiple transactions: ${error.message}`);
    }
  }, [fetchTransactions]);

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
      await clearAllTransactions();

      // Use a set of common account and vendor names for demo data
      const baseAccountNames = ["Checking Account", "Savings Account", "Credit Card", "Investment Account", "Travel Fund", "Emergency Fund"];
      const baseVendorNames = ["SuperMart", "Coffee Shop", "Online Store", "Utility Bill", "Rent Payment", "Gym Membership", "Restaurant A", "Book Store", "Pharmacy", "Gas Station"];
      const currenciesToUse = availableCurrencies.slice(0, 3).map(c => c.code);

      const demoData: Omit<Transaction, 'id' | 'created_at'>[] = [];
      demoData.push(...await generateTransactions(0, 300, baseAccountNames, baseVendorNames, currenciesToUse));
      demoData.push(...await generateTransactions(-1, 300, baseAccountNames, baseVendorNames, currenciesToUse));
      demoData.push(...await generateTransactions(-2, 300, baseAccountNames, baseVendorNames, currenciesToUse));

      console.log("[generateDiverseDemoData] Generated demoData length before insert:", demoData.length); // Added console log
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
    deleteMultipleTransactions,
    clearAllTransactions,
    generateDiverseDemoData,
  }), [transactions, addTransaction, updateTransaction, deleteTransaction, deleteMultipleTransactions, clearAllTransactions, generateDiverseDemoData]);

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