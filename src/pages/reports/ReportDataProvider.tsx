import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Transaction } from '@/types/finance';

interface ReportContextData {
  historicalFilteredTransactions: Transaction[];
  accounts: any[];
  budgets: any[];
  combinedFilteredTransactions: any[];
  futureFilteredTransactions: any[];
}

interface ReportDataProviderProps {
  children: (data: ReportContextData) => React.ReactNode;
}

const ReportDataProvider: React.FC<ReportDataProviderProps> = ({ children }) => {
  const { transactions: historicalFilteredTransactions } = useOutletContext<any>();
  const { accounts } = useTransactions();
  
  // NOTE: Budgets and future transactions are placeholders as their data sources are not fully implemented yet.
  const budgets: any[] = [];
  const combinedFilteredTransactions: any[] = [...historicalFilteredTransactions];
  const futureFilteredTransactions: any[] = [];

  const data: ReportContextData = {
    historicalFilteredTransactions,
    accounts,
    budgets,
    combinedFilteredTransactions,
    futureFilteredTransactions,
  };

  return <>{children(data)}</>;
};

export default ReportDataProvider;