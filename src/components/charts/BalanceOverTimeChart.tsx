import React from 'react';
import { Transaction } from '@/types/transaction';

interface BalanceOverTimeChartProps {
  transactions: Transaction[];
}

const BalanceOverTimeChart: React.FC<BalanceOverTimeChartProps> = ({ transactions }) => {
  return (
    <div className="p-4 border rounded-lg h-full">
      <h3 className="text-lg font-semibold mb-2">Balance Over Time</h3>
      <p className="text-sm text-muted-foreground">Chart placeholder showing {transactions.length} transactions.</p>
    </div>
  );
};

export default BalanceOverTimeChart;