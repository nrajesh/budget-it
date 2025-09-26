import * as React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF5733', '#C70039', '#900C3F'];

const IncomeExpenseSummary = () => {
  const { transactions, isLoadingTransactions } = useTransactions();
  const { formatCurrency } = useCurrency();

  const summaryData = React.useMemo(() => {
    if (!transactions) return { income: [], expense: [] };

    const incomeData: { [key: string]: number } = {};
    const expenseData: { [key: string]: number } = {};

    transactions.forEach(t => {
      if (t.category === 'Transfer') return;

      if (t.amount > 0) {
        incomeData[t.category] = (incomeData[t.category] || 0) + t.amount;
      } else {
        expenseData[t.category] = (expenseData[t.category] || 0) + Math.abs(t.amount);
      }
    });

    const formatChartData = (data: { [key: string]: number }) =>
      Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
      income: formatChartData(incomeData),
      expense: formatChartData(expenseData),
    };
  }, [transactions]);

  const totalIncome = summaryData.income.reduce((acc, item) => acc + item.value, 0);
  const totalExpenses = summaryData.expense.reduce((acc, item) => acc + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 text-sm bg-background border rounded-md shadow-md">
          <p className="label">{`${payload[0].name} : ${formatCurrency(payload[0].value)}`}</p>
          <p className="desc">{`(${(payload[0].payload.percent * 100).toFixed(2)}%)`}</p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = (title: string, data: { name: string; value: number }[], total: number) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Total: {formatCurrency(total)}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No {title.toLowerCase()} data available.
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoadingTransactions) {
    return <div>Loading income and expense data...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {renderPieChart("Income by Category", summaryData.income, totalIncome)}
      {renderPieChart("Expenses by Category", summaryData.expense, totalExpenses)}
    </div>
  );
};

export default IncomeExpenseSummary;