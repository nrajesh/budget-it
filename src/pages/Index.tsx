import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// A simple currency formatting helper
const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const Index = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");

  useEffect(() => {
    const getUserData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // Fetch user profile and budgets in parallel
        const profilePromise = supabase
          .from("user_profile")
          .select("default_currency")
          .eq("id", user.id)
          .single();

        const budgetsPromise = supabase.rpc("get_budgets_with_spending", {
          p_user_id: user.id,
        });

        const [profileResult, budgetsResult] = await Promise.all([
          profilePromise,
          budgetsPromise,
        ]);

        const { data: profile, error: profileError } = profileResult;
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
        } else if (profile && profile.default_currency) {
          setDefaultCurrency(profile.default_currency);
        }

        const { data: budgetsData, error: budgetsError } = budgetsResult;
        if (budgetsError) {
          console.error("Error fetching budgets:", budgetsError);
        } else {
          setBudgets(budgetsData || []);
        }
      }
      setLoading(false);
    };
    getUserData();
  }, []);

  const summary = useMemo(() => {
    if (!budgets.length) {
      return { monthlyBudget: 0, monthlySpent: 0 };
    }

    let totalBudgetNormalized = 0;
    let totalSpent = 0;

    budgets.forEach((budget) => {
      const monthlyFactor =
        {
          monthly: 1,
          quarterly: 3,
          yearly: 12,
          "one-time": 1,
        }[budget.frequency.toLowerCase()] || 1;

      totalBudgetNormalized += budget.target_amount / monthlyFactor;
      totalSpent += budget.spent_amount;
    });

    return {
      monthlyBudget: totalBudgetNormalized,
      monthlySpent: totalSpent,
    };
  }, [budgets]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your financial overview.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Avg. Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(summary.monthlyBudget, defaultCurrency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Monthly Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(summary.monthlySpent, defaultCurrency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Monthly Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(
                summary.monthlyBudget - summary.monthlySpent,
                defaultCurrency
              )}
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Active Budgets</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Budget
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => {
              const spent = budget.spent_amount || 0;
              const target = budget.target_amount;
              const remaining = target - spent;
              const progress = target > 0 ? (spent / target) * 100 : 0;
              const isOverBudget = spent > target;

              return (
                <Card key={budget.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {budget.category_name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="capitalize text-sm font-normal self-start"
                    >
                      {budget.frequency}
                    </Badge>
                    <CardDescription>
                      {format(new Date(budget.start_date), "MMM d, yyyy")} -{" "}
                      {budget.end_date
                        ? format(new Date(budget.end_date), "MMM d, yyyy")
                        : "Ongoing"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          Spent: {formatCurrency(spent, budget.currency)}
                        </span>
                        <span>
                          Target: {formatCurrency(target, budget.currency)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(progress, 100)}
                        className={isOverBudget ? "[&>div]:bg-red-500" : ""}
                      />
                      <p
                        className={`text-sm font-medium ${
                          isOverBudget ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {formatCurrency(Math.abs(remaining), budget.currency)}{" "}
                        {isOverBudget ? "over" : "remaining"}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;