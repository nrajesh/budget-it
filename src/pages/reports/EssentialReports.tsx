import * as React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const EssentialReports = () => {
  const { transactions, isLoadingTransactions } = useTransactions();
  const { formatCurrency, selectedCurrency } = useCurrency();
  const [timeRange, setTimeRange] = React.useState('3'); // Default to 3 months

  const filteredTransactions = React.useMemo(() => {
    const months = parseInt(timeRange, 10);
    if (isNaN(months)) return transactions;
    const endDate = new Date();
    const startDate = startOfMonth(subMonths(endDate, months - 1));
    return transactions.filter(t => new Date(t.date) >= startDate && new Date(t.date) <= endDate);
  }, [transactions, timeRange]);

  const categorySpending = React.useMemo(() => {
    const spending = filteredTransactions
      .filter(t => t.amount < 0 && t.category !== 'Transfer')
      .reduce((acc, t) => {
        const category = t.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as { [key: string]: number });

    return Object.entries(spending)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlySummary = React.useMemo(() => {
    const summary = filteredTransactions.reduce((acc, t) => {
      const month = format(new Date(t.date), 'yyyy-MM');
      if (!acc[month]) {
        acc[month] = { name: format(new Date(t.date), 'MMM yy'), income: 0, expense: 0 };
      }
      if (t.amount > 0 && t.category !== 'Transfer') {
        acc[month].income += t.amount;
      } else if (t.amount < 0 && t.category !== 'Transfer') {
        acc[month].expense += Math.abs(t.amount);
      }
      return acc;
    }, {} as { [key: string]: { name: string; income: number; expense: number } });

    return Object.values(summary).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTransactions]);

  if (isLoadingTransactions) {
    return <div>Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Essential Reports</h2>
        <div className="w-[180px]">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last month</SelectItem>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySpending} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value as number, selectedCurrency)} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value as number, selectedCurrency)} />
                  <Bar dataKey="value" name="Spending">
                    {categorySpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income vs. Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySummary} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value as number, selectedCurrency)} />
                  <Tooltip formatter={(value) => formatCurrency(value as number, selectedCurrency)} />
                  <Legend />
                  <Bar dataKey="income" fill="#82ca9d" name="Income" />
                  <Bar dataKey="expense" fill="#ff8042" name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EssentialReports;