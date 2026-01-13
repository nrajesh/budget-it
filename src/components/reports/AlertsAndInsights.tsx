import React from 'react';
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from "@/components/ThemedCard";
import { AlertTriangle, BarChart2, ShoppingCart, Banknote } from 'lucide-react';
import { useCurrency } from "@/contexts/CurrencyContext";
import { differenceInDays } from 'date-fns';
import { Budget } from '@/data/finance-data';
import { useNavigate } from "react-router-dom";

interface AlertsAndInsightsProps {
  historicalTransactions: any[];
  futureTransactions: any[];
  accounts: any[];
  budgets: Budget[];
}

const AlertsAndInsights: React.FC<AlertsAndInsightsProps> = ({ historicalTransactions, futureTransactions, accounts, budgets }) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const navigate = useNavigate();

  const handleAccountClick = (accountName: string) => {
    navigate('/transactions', { state: { filterAccount: accountName } });
  };

  const handleVendorClick = (vendorName: string) => {
    const isAccount = accounts.some(acc => acc.name === vendorName);
    const filterKey = isAccount ? 'filterAccount' : 'filterVendor';
    navigate('/transactions', { state: { [filterKey]: vendorName } });
  };

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === 'Transfer') return;
    navigate('/transactions', { state: { filterCategory: categoryName } });
  };

  // 1. Calculate Low Balance Alerts
  const lowBalanceAlerts = React.useMemo(() => {
    const alerts: { accountName: string; daysUntilNegative: number; finalBalance: number }[] = [];
    if (accounts.length === 0) return [];

    const currentBalances: Record<string, number> = {};
    accounts.forEach(acc => {
      const startingBalance = acc.starting_balance || 0;
      const accountCurrency = acc.currency || 'USD';
      currentBalances[acc.name] = convertBetweenCurrencies(startingBalance, accountCurrency, selectedCurrency);
    });

    historicalTransactions.forEach(t => {
      if (t.category !== 'Transfer') {
        const convertedAmount = convertBetweenCurrencies(t.amount, t.currency, selectedCurrency);
        currentBalances[t.account] = (currentBalances[t.account] || 0) + convertedAmount;
      }
    });

    const sortedFutureTx = [...futureTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const projectedBalances = { ...currentBalances };
    const negativeDateMap: Record<string, Date> = {};

    for (const tx of sortedFutureTx) {
      const convertedAmount = convertBetweenCurrencies(tx.amount, tx.currency, selectedCurrency);
      projectedBalances[tx.account] = (projectedBalances[tx.account] || 0) + convertedAmount;

      if (projectedBalances[tx.account] < 0 && !negativeDateMap[tx.account]) {
        negativeDateMap[tx.account] = new Date(tx.date);
      }
    }

    Object.keys(negativeDateMap).forEach(accountName => {
      const daysUntilNegative = differenceInDays(negativeDateMap[accountName], new Date());
      alerts.push({
        accountName,
        daysUntilNegative: daysUntilNegative >= 0 ? daysUntilNegative : 0,
        finalBalance: projectedBalances[accountName],
      });
    });

    return alerts;
  }, [historicalTransactions, futureTransactions, accounts, selectedCurrency, convertBetweenCurrencies]);

  // 2. Calculate Budget Overrun Alerts
  const budgetOverrunAlerts = React.useMemo(() => {
    const alerts: { categoryName: string; percentage: number; }[] = [];
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const activeMonthlyBudgets = budgets.filter(b => {
      const startDate = new Date(b.start_date);
      const endDate = b.end_date ? new Date(b.end_date) : null;
      return b.is_active && b.frequency === '1m' && startDate <= now && (!endDate || endDate >= now);
    });

    activeMonthlyBudgets.forEach(budget => {
      const targetAmount = convertBetweenCurrencies(budget.target_amount, budget.currency, selectedCurrency);
      const actualSpending = historicalTransactions
        .filter(t =>
          t.category === budget.category_name &&
          new Date(t.date) >= periodStart &&
          new Date(t.date) <= periodEnd &&
          t.amount < 0
        )
        .reduce((sum, t) => sum + convertBetweenCurrencies(Math.abs(t.amount), t.currency, selectedCurrency), 0);

      const percentage = targetAmount > 0 ? (actualSpending / targetAmount) * 100 : 0;

      if (percentage >= 90) {
        alerts.push({
          categoryName: budget.category_name!,
          percentage: Math.round(percentage),
        });
      }
    });

    return alerts.sort((a, b) => b.percentage - a.percentage);
  }, [historicalTransactions, budgets, selectedCurrency, convertBetweenCurrencies]);

  // 3. Calculate Key Insights from historical data
  const keyInsights = React.useMemo(() => {
    const expenseCategoryCounts: Record<string, number> = {};
    const expenseVendorCounts: Record<string, number> = {};
    const accountActivityCounts: Record<string, number> = {};

    historicalTransactions.forEach(t => {
      if (t.category !== 'Transfer') {
        accountActivityCounts[t.account] = (accountActivityCounts[t.account] || 0) + 1;
      }
      if (t.amount < 0 && t.category !== 'Transfer') {
        expenseCategoryCounts[t.category] = (expenseCategoryCounts[t.category] || 0) + 1;
        expenseVendorCounts[t.vendor] = (expenseVendorCounts[t.vendor] || 0) + 1;
      }
    });

    const getTopThree = (counts: Record<string, number>) => Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return {
      topCategories: getTopThree(expenseCategoryCounts),
      topVendors: getTopThree(expenseVendorCounts),
      topAccounts: getTopThree(accountActivityCounts),
    };
  }, [historicalTransactions]);

  return (
    <ThemedCard>
      <ThemedCardHeader>
        <ThemedCardTitle>Alerts and Insights</ThemedCardTitle>
        <ThemedCardDescription>
          Automated analysis of your financial data based on the selected filters.
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
            Financial Alerts
          </h3>
          {lowBalanceAlerts.length === 0 && budgetOverrunAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No financial alerts to show. Great job!</p>
          ) : (
            <>
              {lowBalanceAlerts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Low Balance Warnings:</h4>
                  <ul className="space-y-2 list-disc pl-5 text-sm">
                    {lowBalanceAlerts.map(alert => (
                      <li key={alert.accountName}>
                        <span onClick={() => handleAccountClick(alert.accountName)} className="font-semibold cursor-pointer hover:text-primary hover:underline">{alert.accountName}</span> is projected to have a negative balance in{' '}
                        <span className="font-bold text-destructive">{alert.daysUntilNegative} days</span>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {budgetOverrunAlerts.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Budget Overrun Warnings:</h4>
                  <ul className="space-y-2 list-disc pl-5 text-sm">
                    {budgetOverrunAlerts.map(alert => (
                      <li key={alert.categoryName}>
                        <span onClick={() => handleCategoryClick(alert.categoryName)} className="font-semibold cursor-pointer hover:text-primary hover:underline">{alert.categoryName}</span> budget is at{' '}
                        <span className={`font-bold ${alert.percentage >= 100 ? 'text-destructive' : 'text-amber-500'}`}>{alert.percentage}%</span> of its monthly limit.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Key Insights</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <BarChart2 className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold">Top Spending Categories</p>
                {keyInsights.topCategories.length > 0 ? (
                  <p className="text-muted-foreground">
                    {keyInsights.topCategories.map(([name], index) => (
                      <React.Fragment key={name}>
                        <span onClick={() => handleCategoryClick(name)} className="cursor-pointer hover:text-primary hover:underline">{name}</span>
                        {index < keyInsights.topCategories.length - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))}
                  </p>
                ) : <p className="text-muted-foreground">No spending data.</p>}
              </div>
            </div>
            <div className="flex items-start">
              <ShoppingCart className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold">Most Frequented Vendors</p>
                {keyInsights.topVendors.length > 0 ? (
                  <p className="text-muted-foreground">
                    {keyInsights.topVendors.map(([name], index) => (
                      <React.Fragment key={name}>
                        <span onClick={() => handleVendorClick(name)} className="cursor-pointer hover:text-primary hover:underline">{name}</span>
                        {index < keyInsights.topVendors.length - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))}
                  </p>
                ) : <p className="text-muted-foreground">No spending data.</p>}
              </div>
            </div>
            <div className="flex items-start">
              <Banknote className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold">Most Active Accounts</p>
                {keyInsights.topAccounts.length > 0 ? (
                  <p className="text-muted-foreground">
                    {keyInsights.topAccounts.map(([name], index) => (
                      <React.Fragment key={name}>
                        <span onClick={() => handleAccountClick(name)} className="cursor-pointer hover:text-primary hover:underline">{name}</span>
                        {index < keyInsights.topAccounts.length - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))}
                  </p>
                ) : <p className="text-muted-foreground">No transaction data.</p>}
              </div>
            </div>
          </div>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default AlertsAndInsights;