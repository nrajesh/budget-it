import * as React from 'react';
import { transactionsData, Transaction, accounts } from '@/data/finance-data';

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'date'> & { date: string }) => void;
  updateTransaction: (transaction: Transaction) => void;
}

const TransactionsContext = React.createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>(transactionsData);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'currency' | 'date'> & { date: string }) => {
    const isTransfer = accounts.includes(transaction.vendor);

    if (isTransfer) {
      const debitTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}_d`,
        amount: -Math.abs(transaction.amount),
        category: 'Transfer',
        remarks: transaction.remarks ? `${transaction.remarks} (To ${transaction.vendor})` : `Transfer to ${transaction.vendor}`,
        currency: 'USD',
        date: new Date(transaction.date).toISOString(),
      };

      const creditTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}_c`,
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
    setTransactions(prev =>
      prev.map(t => (t.id === updatedTransaction.id ? updatedTransaction : t))
    );
  };

  return (
    <TransactionsContext.Provider value={{ transactions, addTransaction, updateTransaction }}>
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