"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTransactions, Transaction } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path
import { formatDateToDDMMYYYY } from "@/lib/utils";

interface BalanceOverTimeChartProps {
  transactions: Transaction[];
}

export const BalanceOverTimeChart: React.FC<BalanceOverTimeChartProps> = ({ transactions }) => {
  const { selectedCurrency, formatCurrency, convertBetweenCurrencies, accountCurrencyMap } = useCurrency();

  // Placeholder for chart logic
  const balanceData = React.useMemo(() => {
    if (!transactions) return [];

    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const dataPoints: { date: string; balance: number }[] = [];

    sortedTransactions.forEach(t => {
      const convertedAmount = convertBetweenCurrencies(t.amount, t.currency, selectedCurrency, accountCurrencyMap);
      runningBalance += convertedAmount;
      dataPoints.push({ date: formatDateToDDMMYYYY(new Date(t.date)), balance: runningBalance });
    });

    return dataPoints;
  }, [transactions, selectedCurrency, convertBetweenCurrencies, accountCurrencyMap]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {balanceData.length > 0 ? (
          <div className="h-[200px] flex items-center justify-center text-gray-500">
            {/* Placeholder for a chart library, e.g., Recharts, Nivo */}
            Chart would go here. Last balance: {formatCurrency(balanceData[balanceData.length - 1].balance, selectedCurrency)}
          </div>
        ) : (
          <p className="text-center text-gray-500">No transaction data to display balance over time.</p>
        )}
      </CardContent>
    </Card>
  );
};