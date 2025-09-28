import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { useCurrency } from "@/contexts/CurrencyContext";
import { Budget } from '@/data/finance-data';

interface TrendsAndAnalyticsProps {
  transactions: any[];
  budgets: Budget[];
}

const TrendsAndAnalytics: React.FC<TrendsAndAnalyticsProps> = ({ transactions, budgets }) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

  const monthlyData = React.useMemo(() => {
    const dataByMonth: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach(t => {
      const month = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!dataByMonth[month]) {
        dataByMonth[month] = { income: 0, expenses: 0 };
      }
      if (t.category !== 'Transfer') {
        const convertedAmount = convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
        if (convertedAmount > 0) {
          dataByMonth[month].income += convertedAmount;
        } else {
          dataByMonth[month].expenses += Math.abs(convertedAmount);
        }
      }
    });

    return Object.entries(dataByMonth).map(([month, values]) => {
      const monthDate = new Date(month.replace(/(\w{3})\s(\d{2})/, "$1 1, 20$2"));
      const totalBudgetForMonth = budgets
        .filter(b => {
          const startDate = new Date(b.start_date);
          const endDate = b.end_date ? new Date(b.end_date) : null;
          return b.is_active && b.frequency === '1m' && startDate <= monthDate && (!endDate || endDate >= monthDate);
        })
        .reduce((sum, b) => sum + convertBetweenCurrencies(b.target_amount, b.currency, selectedCurrency), 0);

      return { month, ...values, budgetTarget: totalBudgetForMonth > 0 ? totalBudgetForMonth : null };
    }).reverse();
  }, [transactions, budgets, selectedCurrency, convertBetweenCurrencies]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trends and Analytics</CardTitle>
        <CardDescription>Monthly patterns in your spending and income.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="income" fill="#22c55e" name="Income" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            <Line type="monotone" dataKey="budgetTarget" stroke="#ff7300" strokeWidth={2} name="Budget Target" dot={false} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TrendsAndAnalytics;