import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/contexts/UserContext';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Budget } from '@/data/finance-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export const BudgetHealthWidget = () => {
  const { user } = useUser();
  const { transactions } = useTransactions();
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

  const { data: budgets = [], isLoading } = useQuery<Budget[], Error>({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('budgets')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) throw error;
      return data.map(b => ({ ...b, category_name: b.categories.name })) as Budget[];
    },
    enabled: !!user,
  });

  const healthData = React.useMemo(() => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const activeMonthlyBudgets = budgets.filter(b => {
      const startDate = new Date(b.start_date);
      const endDate = b.end_date ? new Date(b.end_date) : null;
      return b.frequency === '1m' && startDate <= now && (!endDate || endDate >= now);
    });

    if (activeMonthlyBudgets.length === 0) {
      return { totalBudget: 0, totalSpending: 0, percentage: 0 };
    }

    const totalBudget = activeMonthlyBudgets.reduce((sum, b) => {
      return sum + convertBetweenCurrencies(b.target_amount, b.currency, selectedCurrency);
    }, 0);

    const totalSpending = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        const budgetForTransaction = activeMonthlyBudgets.find(b => b.category_name === t.category);
        return budgetForTransaction &&
               transactionDate >= periodStart &&
               transactionDate <= periodEnd &&
               t.amount < 0;
      })
      .reduce((sum, t) => {
        return sum + convertBetweenCurrencies(Math.abs(t.amount), t.currency, selectedCurrency);
      }, 0);

    const percentage = totalBudget > 0 ? (totalSpending / totalBudget) * 100 : 0;

    return { totalBudget, totalSpending, percentage };
  }, [budgets, transactions, selectedCurrency, convertBetweenCurrencies]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overall Budget Health</CardTitle>
          <CardDescription>This Month</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (healthData.totalBudget === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overall Budget Health</CardTitle>
          <CardDescription>This Month</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <p className="text-sm text-muted-foreground">No active monthly budgets for this period.</p>
        </CardContent>
      </Card>
    );
  }

  const progressColor = healthData.percentage > 100 ? "bg-red-500" : "bg-primary";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Budget Health</CardTitle>
        <CardDescription>This Month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>{formatCurrency(healthData.totalSpending)}</span>
            <span>{formatCurrency(healthData.totalBudget)}</span>
          </div>
          <Progress value={healthData.percentage} indicatorClassName={progressColor} />
          <p className="text-sm text-muted-foreground text-center">
            {Math.round(healthData.percentage)}% of budget spent
          </p>
        </div>
      </CardContent>
    </Card>
  );
};