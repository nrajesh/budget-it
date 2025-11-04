import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const Index = () => {
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalTransactions: 0,
    previousMonthSpent: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();

        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', currentMonthStart)
          .order('date', { ascending: false });

        const { data: lastMonthTransactions, error: lastMonthError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .gte('date', lastMonthStart)
          .lte('date', lastMonthEnd);

        if (transactionsError || lastMonthError) {
          console.error(transactionsError || lastMonthError);
        } else if (transactions) {
          const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
          const previousMonthSpent = lastMonthTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          
          setStats({
            totalSpent,
            totalTransactions: transactions.length,
            previousMonthSpent,
          });
          setRecentTransactions(transactions.slice(0, 5));

          const categorySpending = transactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
            return acc;
          }, {} as Record<string, number>);

          const chartData: {name: string, amount: number}[] = Object.entries(categorySpending)
            .map(([name, amount]) => ({ name, amount: Number(amount) }))
            .sort((a, b) => b.amount - a.amount);
          
          setSpendingByCategory(chartData);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const spentChange = stats.previousMonthSpent > 0 
    ? ((stats.totalSpent - stats.previousMonthSpent) / stats.previousMonthSpent) * 100
    : stats.totalSpent > 0 ? 100 : 0;

  const renderLoadingState = () => (
    <div className="flex flex-col gap-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Here's a summary of your financial activity.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><Skeleton className="h-5 w-3/5" /></CardHeader><CardContent><Skeleton className="h-8 w-4/5 mb-2" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-3/5" /></CardHeader><CardContent><Skeleton className="h-8 w-4/5 mb-2" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4"><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
        <Card className="lg:col-span-3"><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    </div>
  );

  if (loading) {
    return renderLoadingState();
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Here's a summary of your financial activity.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent (This Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {spentChange.toFixed(1)}% from last month
              {spentChange >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-500 ml-1" /> : <ArrowDownRight className="h-4 w-4 text-red-500 ml-1" />}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions (This Month)</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Total transactions recorded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>This month's spending breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={spendingByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your 5 most recent transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.vendor || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(t.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;