import * as React from 'react';
import { transactionsData, Transaction, accounts } from '@/data/finance-data';

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'date' | 'transferId'> & { date: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string, transferId?: string) => void;
}

const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>(transactionsData);

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
        remarks: transaction.remarks ? `${transaction.remarks} (From ${transaction.account})` : `Transfer from ${transaction.account}`,
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
      if (updatedTransaction.transferId) {
        const sibling = prev.find(t => t.transferId === updatedTransaction.transferId && t.id !== updatedTransaction.id);
        if (!sibling) {
          return prev.map(t => (t.id === updatedTransaction.id ? updatedTransaction : t));
        }

        const oldDebit = updatedTransaction.amount < 0 ? updatedTransaction : sibling;
        const oldCredit = updatedTransaction.amount < 0 ? sibling : updatedTransaction;

        const newDate = updatedTransaction.date;
        const newAmount = Math.abs(updatedTransaction.amount);
        const baseRemarks = updatedTransaction.remarks?.split(" (From ")[0].split(" (To ")[0] || "";

        const newDebitAccount = updatedTransaction.amount < 0 ? updatedTransaction.account : updatedTransaction.vendor;
        const newCreditAccount = updatedTransaction.amount < 0 ? updatedTransaction.vendor : updatedTransaction.account;

        const newDebit: Transaction = {
          ...oldDebit,
          date: newDate,
          account: newDebitAccount,
          vendor: newCreditAccount,
          amount: -newAmount,
          remarks: baseRemarks ? `${baseRemarks} (To ${newCreditAccount})` : `Transfer to ${newCreditAccount}`,
        };

        const newCredit: Transaction = {
          ...oldCredit,
          date: newDate,
          account: newCreditAccount,
          vendor: newDebitAccount,
          amount: newAmount,
          remarks: baseRemarks ? `${baseRemarks} (From ${newDebitAccount})` : `Transfer from ${newDebitAccount}`,
        };
        
        return prev.map(t => {
          if (t.id === newDebit.id) return newDebit;
          if (t.id === newCredit.id) return newCredit;
          return t;
        });

      } else {
        return prev.map(t => (t.id === updatedTransaction.id ? updatedTransaction : t));
      }
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