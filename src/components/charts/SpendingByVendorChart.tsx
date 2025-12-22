import React from 'react';
import { Transaction } from '@/types/transaction';

interface SpendingByVendorChartProps {
  transactions: Transaction[];
}

const SpendingByVendorChart: React.FC<SpendingByVendorChartProps> = ({ transactions }) => {
  return (
    <div className="p-4 border rounded-lg h-full">
      <h3 className="text-lg font-semibold mb-2">Spending by Vendor</h3>
      <p className="text-sm text-muted-foreground">Chart placeholder showing {transactions.length} transactions.</p>
    </div>
  );
};

export default SpendingByVendorChart;