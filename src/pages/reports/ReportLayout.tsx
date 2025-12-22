import React from 'react';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { useTransactionData } from '@/hooks/useTransactionData';

interface ReportLayoutProps {
  children: (props: {
    historicalFilteredTransactions: any[];
    combinedFilteredTransactions: any[];
    futureFilteredTransactions: any[];
    accounts: any[];
    budgets: any[];
  }) => React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({ children, title, description }) => {
  const filterProps = useTransactionFilters();
  const dataProps = useTransactionData(filterProps);

  const { historicalFilteredTransactions, futureFilteredTransactions } = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const historical = dataProps.filteredTransactions.filter(t => new Date(t.date) <= today);
    const future = dataProps.filteredTransactions.filter(t => new Date(t.date) > today && t.is_scheduled_origin);
    return { historicalFilteredTransactions: historical, futureFilteredTransactions: future };
  }, [dataProps.filteredTransactions]);

  const combinedFilteredTransactions = [...historicalFilteredTransactions, ...futureFilteredTransactions];
  const accounts = []; // Placeholder
  const budgets = []; // Placeholder

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      {children({
        historicalFilteredTransactions,
        combinedFilteredTransactions,
        futureFilteredTransactions,
        accounts,
        budgets,
      })}
    </div>
  );
};

export default ReportLayout;