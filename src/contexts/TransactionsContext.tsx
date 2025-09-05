import * as React from 'react';
import { Transaction, accounts, vendors, categories } from '@/data/finance-data';

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'date' | 'transferId'> & { date: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string, transferId?: string) => void;
}

const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

// Helper function to generate sample transactions for the last month
const generateSampleTransactions = (count: number): Transaction[] => {
  const sampleTransactions: Transaction[] = [];
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Start of last month
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0); // End of last month

  for (let i = 0; i < count; i++) {
    const randomDay = Math.floor(Math.random() * (endOfLastMonth.getDate() - lastMonth.getDate() + 1)) + lastMonth.getDate();
    const date = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), randomDay);

    const isTransfer = Math.random() < 0.2; // 20% chance of being a transfer
    let vendorName = vendors[Math.floor(Math.random() * vendors.length)];
    let categoryName = categories[Math.floor(Math.random() * categories.length)];
    let amountValue = parseFloat((Math.random() * 200 + 10).toFixed(2)); // Amount between 10 and 210

    const accountName = accounts[Math.floor(Math.random() * accounts.length)];

    if (isTransfer) {
      // Ensure vendor is an account and not the same as the source account
      let destAccount = accounts[Math.floor(Math.random() * accounts.length)];
      while (destAccount === accountName) {
        destAccount = accounts[Math.floor(Math.random() * accounts.length)];
      }
      vendorName = destAccount; // Vendor becomes the destination account
      categoryName = 'Transfer';
      amountValue = Math.abs(amountValue); // Transfers are always positive in the credit entry
    } else {
      // For non-transfers, 60% chance of being an expense, 40% income
      if (Math.random() < 0.6 && categoryName !== 'Salary') {
        amountValue = -amountValue; // Make it an expense
      } else if (categoryName === 'Salary') {
        amountValue = Math.abs(amountValue) * 5; // Make salary larger
      }
    }

    const baseTransactionDetails: Omit<Transaction, 'id' | 'transferId'> = {
      date: date.toISOString(),
      account: accountName,
      currency: "USD",
      vendor: vendorName,
      amount: amountValue,
      remarks: Math.random() > 0.7 ? `Sample remark ${i + 1}` : undefined,
      category: categoryName,
    };

    if (isTransfer) {
      const transferId = `transfer_${Date.now()}_${i}`;
      const debitTransaction: Transaction = {
        ...baseTransactionDetails,
        id: `txn_${Date.now()}_${i}_d`,
        transferId,
        amount: -Math.abs(baseTransactionDetails.amount), // Debit from source account
        category: 'Transfer',
        remarks: baseTransactionDetails.remarks ? `${baseTransactionDetails.remarks} (To ${baseTransactionDetails.vendor})` : `Transfer to ${baseTransactionDetails.vendor}`,
      };
      sampleTransactions.push(debitTransaction);

      const creditTransaction: Transaction = {
        ...baseTransactionDetails,
        id: `txn_${Date.now()}_${i}_c`,
        transferId,
        account: baseTransactionDetails.vendor, // Destination account
        vendor: baseTransactionDetails.account, // Source account
        amount: Math.abs(baseTransactionDetails.amount), // Credit to destination account
        category: 'Transfer',
        remarks: baseTransactionDetails.remarks ? `${(baseTransactionDetails.remarks as string).replace(`(To ${baseTransactionDetails.vendor})`, `(From ${baseTransactionDetails.account})`)}` : `Transfer from ${baseTransactionDetails.account}`,
      };
      sampleTransactions.push(creditTransaction);
    } else {
      const singleTransaction: Transaction = {
        ...baseTransactionDetails,
        id: `txn_${Date.now()}_${i}`,
      };
      sampleTransactions.push(singleTransaction);
    }
  }
  return sampleTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with 20 sample transactions for the last month
  const [transactions, setTransactions] = React.useState<Transaction[]>(() => generateSampleTransactions(20));

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
        currency: 'USD',
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
        currency: 'USD',
        date: new Date(transaction.date).toISOString(),
      };
      
      setTransactions(prev => [debitTransaction, creditTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } else {
      const newTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}`,
        currency: 'USD',
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
          category: 'Transfer', // Ensure category is 'Transfer' for transfers
          remarks: baseRemarks ? `${baseRemarks} (To ${newCreditAccount})` : `Transfer to ${newCreditAccount}`,
        };

        const newCredit: Transaction = {
          ...oldCredit,
          date: newDate,
          account: newCreditAccount,
          vendor: newDebitAccount,
          amount: newAmount,
          category: 'Transfer', // Ensure category is 'Transfer' for transfers
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

  return (
    <TransactionsContext.Provider value={{ transactions, addTransaction, updateTransaction, deleteTransaction }}>
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