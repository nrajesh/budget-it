import * as React from 'react';
import { Transaction, accounts, vendors, categories } from '@/data/finance-data';
import { useCurrency } from './CurrencyContext'; // Import useCurrency to get available currencies

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'date' | 'transferId'> & { date: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string, transferId?: string) => void;
  clearAllTransactions: () => void; // New function
  generateDiverseDemoData: () => void; // New function
}

const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

// Helper function to generate sample transactions for a given month, account, and currency
const generateTransactions = (
  monthOffset: number,
  count: number,
  accountNames: string[],
  currencyCodes: string[]
): Transaction[] => {
  const sampleTransactions: Transaction[] = [];
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const endOfTargetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);

  for (let i = 0; i < count; i++) {
    const randomDay = Math.floor(Math.random() * (endOfTargetMonth.getDate() - targetMonth.getDate() + 1)) + targetMonth.getDate();
    const date = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), randomDay);

    const isTransfer = Math.random() < 0.2; // 20% chance of being a transfer
    const accountName = accountNames[Math.floor(Math.random() * accountNames.length)];
    const currencyCode = currencyCodes[Math.floor(Math.random() * currencyCodes.length)];

    let vendorName = vendors[Math.floor(Math.random() * vendors.length)];
    let categoryName = categories[Math.floor(Math.random() * categories.length)];
    let amountValue = parseFloat((Math.random() * 200 + 10).toFixed(2)); // Amount between 10 and 210

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

    const baseTransactionDetails: Omit<Transaction, 'id' | 'transferId'> = {
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
      const debitTransaction: Transaction = {
        ...baseTransactionDetails,
        id: `txn_${Date.now()}_${i}_d_${monthOffset}_${accountName.replace(/\s/g, '')}`,
        transferId,
        amount: -Math.abs(baseTransactionDetails.amount),
        category: 'Transfer',
        remarks: baseTransactionDetails.remarks ? `${baseTransactionDetails.remarks} (To ${baseTransactionDetails.vendor})` : `Transfer to ${baseTransactionDetails.vendor}`,
      };
      sampleTransactions.push(debitTransaction);

      const creditTransaction: Transaction = {
        ...baseTransactionDetails,
        id: `txn_${Date.now()}_${i}_c_${monthOffset}_${accountName.replace(/\s/g, '')}`,
        transferId,
        account: baseTransactionDetails.vendor,
        vendor: baseTransactionDetails.account,
        amount: Math.abs(baseTransactionDetails.amount),
        category: 'Transfer',
        remarks: baseTransactionDetails.remarks ? `${(baseTransactionDetails.remarks as string).replace(`(To ${baseTransactionDetails.vendor})`, `(From ${baseTransactionDetails.account})`)}` : `Transfer from ${baseTransactionDetails.account}`,
      };
      sampleTransactions.push(creditTransaction);
    } else {
      const singleTransaction: Transaction = {
        ...baseTransactionDetails,
        id: `txn_${Date.now()}_${i}_${monthOffset}_${accountName.replace(/\s/g, '')}`,
      };
      sampleTransactions.push(singleTransaction);
    }
  }
  return sampleTransactions;
};

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { availableCurrencies } = useCurrency(); // Get available currencies from context

  const [transactions, setTransactions] = React.useState<Transaction[]>([]); // Start with empty transactions

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'currency' | 'date' | 'transferId'> & { date: string }) => {
    const isTransfer = accounts.includes(transaction.vendor);

    if (isTransfer) {
      const transferId = `transfer_${Date.now()}`;
      const debitTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}_d`,
        transferId,
        amount: -Math.abs(transaction.amount),
        category: 'Transfer',
        remarks: transaction.remarks ? `${transaction.remarks} (To ${transaction.vendor})` : `Transfer to ${transaction.vendor}`,
        currency: 'USD', // Default to USD for new manual transactions
        date: new Date(transaction.date).toISOString(),
      };

      const creditTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}_c`,
        transferId,
        account: transaction.vendor,
        vendor: transaction.account,
        amount: Math.abs(transaction.amount),
        category: 'Transfer',
        remarks: transaction.remarks ? `${(transaction.remarks as string).replace(`(To ${transaction.vendor})`, `(From ${transaction.account})`)}` : `Transfer from ${transaction.account}`,
        currency: 'USD', // Default to USD for new manual transactions
        date: new Date(transaction.date).toISOString(),
      };
      
      setTransactions(prev => [debitTransaction, creditTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } else {
      const newTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}`,
        currency: 'USD', // Default to USD for new manual transactions
        date: new Date(transaction.date).toISOString(),
      };
      setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => {
      const originalTransaction = prev.find(t => t.id === updatedTransaction.id);
      if (!originalTransaction) {
        return prev; // Should not happen
      }

      const wasTransfer = !!originalTransaction.transferId;
      const isNowTransfer = accounts.includes(updatedTransaction.vendor);

      // Case 1: Editing a regular transaction to become a transfer
      if (!wasTransfer && isNowTransfer) {
        const filteredTransactions = prev.filter(t => t.id !== originalTransaction.id);
        const transferId = `transfer_${Date.now()}`;
        const baseRemarks = updatedTransaction.remarks || "";
        const newAmount = Math.abs(updatedTransaction.amount);

        const debitTransaction: Transaction = {
          ...updatedTransaction,
          id: `txn_${Date.now()}_d`,
          transferId,
          amount: -newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${updatedTransaction.vendor})` : `Transfer to ${updatedTransaction.vendor}`,
        };

        const creditTransaction: Transaction = {
          ...updatedTransaction,
          id: `txn_${Date.now()}_c`,
          transferId,
          account: updatedTransaction.vendor,
          vendor: updatedTransaction.account,
          amount: newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${(baseRemarks as string).replace(`(To ${updatedTransaction.vendor})`, `(From ${updatedTransaction.account})`)}` : `Transfer from ${updatedTransaction.account}`,
        };
        
        return [debitTransaction, creditTransaction, ...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      // Case 2: Editing a transfer to become a regular transaction
      if (wasTransfer && !isNowTransfer) {
        const filteredTransactions = prev.filter(t => t.transferId !== originalTransaction.transferId);
        const newSingleTransaction: Transaction = {
          ...updatedTransaction,
          id: `txn_${Date.now()}`,
          transferId: undefined,
          amount: -Math.abs(updatedTransaction.amount),
        };
        
        return [newSingleTransaction, ...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      // Case 3: Editing a transfer (remains a transfer)
      if (wasTransfer && isNowTransfer) {
        const sibling = prev.find(t => t.transferId === updatedTransaction.transferId && t.id !== updatedTransaction.id);
        if (!sibling) {
          return prev.map(t => (t.id === updatedTransaction.id ? updatedTransaction : t));
        }

        const oldDebit = originalTransaction.amount < 0 ? originalTransaction : sibling;
        const oldCredit = originalTransaction.amount < 0 ? sibling : originalTransaction;

        const newDate = updatedTransaction.date;
        const newAmount = Math.abs(updatedTransaction.amount);
        const baseRemarks = updatedTransaction.remarks?.split(" (From ")[0].split(" (To ")[0] || "";

        const newDebitAccount = updatedTransaction.account;
        const newCreditAccount = updatedTransaction.vendor;

        const newDebit: Transaction = {
          ...oldDebit,
          date: newDate,
          account: newDebitAccount,
          vendor: newCreditAccount,
          amount: -newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${baseRemarks} (To ${newCreditAccount})` : `Transfer to ${newCreditAccount}`,
        };

        const newCredit: Transaction = {
          ...oldCredit,
          date: newDate,
          account: newCreditAccount,
          vendor: newDebitAccount,
          amount: newAmount,
          category: 'Transfer',
          remarks: baseRemarks ? `${(baseRemarks as string).replace(`(To ${newCreditAccount})`, `(From ${newDebitAccount})`)}` : `Transfer from ${newDebitAccount}`,
        };
        
        return prev.map(t => {
          if (t.id === oldDebit.id) return newDebit;
          if (t.id === oldCredit.id) return newCredit;
          return t;
        });
      }

      // Case 4: Editing a regular transaction (remains regular)
      return prev.map(t => (t.id === updatedTransaction.id ? updatedTransaction : t));
    });
  };

  const deleteTransaction = (transactionId: string, transferId?: string) => {
    setTransactions(prev => {
      if (transferId) {
        return prev.filter(t => t.transferId !== transferId);
      }
      return prev.filter(t => t.id !== transactionId);
    });
  };

  const clearAllTransactions = React.useCallback(() => {
    setTransactions([]);
  }, []);

  const generateDiverseDemoData = React.useCallback(() => {
    const accountsToUse = accounts; // All 6 accounts
    const currenciesToUse = availableCurrencies.slice(0, 3).map(c => c.code); // First 3 currencies (e.g., USD, EUR, GBP)

    const demoData: Transaction[] = [];
    // Generate data for current month, previous month, and two months ago
    // Aim for ~300 base transactions per month to get over 1000 total transactions (considering transfers)
    demoData.push(...generateTransactions(0, 300, accountsToUse, currenciesToUse));
    demoData.push(...generateTransactions(-1, 300, accountsToUse, currenciesToUse));
    demoData.push(...generateTransactions(-2, 300, accountsToUse, currenciesToUse));

    setTransactions(demoData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [availableCurrencies]);

  // Initial data generation when the component mounts for the first time
  React.useEffect(() => {
    if (transactions.length === 0) { // Only generate if no transactions exist
      generateDiverseDemoData();
    }
  }, [generateDiverseDemoData, transactions.length]);


  const value = React.useMemo(() => ({
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    generateDiverseDemoData,
  }), [transactions, addTransaction, updateTransaction, deleteTransaction, clearAllTransactions, generateDiverseDemoData]);

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