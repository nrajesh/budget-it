"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext.tsx"; // Re-applying correct relative path
import { SpendingByCategoryChart } from "../components/SpendingByCategoryChart.tsx"; // Re-applying correct relative path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext.tsx"; // Ensuring this related path is also correct
import { type Transaction } from "../data/finance-data.ts"; // Ensuring this related path is also correct

const Index = () => {
  const { user } = useAuth();
  const { formatCurrency, selectedCurrency } = useCurrency();

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalIncome = React.useMemo(() => {
    return transactions?.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0) || 0;
  }, [transactions]);

  const totalExpenses = React.useMemo(() => {
    return transactions?.reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0) || 0;
  }, [transactions]);

  const netBalance = totalIncome - totalExpenses;

  if (isLoadingTransactions) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">
              Income recorded in {selectedCurrency}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              Expenses recorded in {selectedCurrency}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Current balance in {selectedCurrency}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {transactions && transactions.length > 0 && (
          <SpendingByCategoryChart transactions={transactions} />
        )}
      </div>
    </div>
  );
};

export default Index;