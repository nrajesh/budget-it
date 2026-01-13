import React from 'react';
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from "@/components/ThemedCard";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface NetWorthStatementProps {
  transactions: any[];
  accounts: any[];
}

const NetWorthStatement: React.FC<NetWorthStatementProps> = ({ transactions, accounts }) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

  const { assets, liabilities, netWorth } = React.useMemo(() => {
    const accountBalances: Record<string, number> = {};

    // Initialize balances by converting each account's starting balance to the selected currency
    accounts.forEach(account => {
      const startingBalance = account.starting_balance || 0;
      const accountCurrency = account.currency || 'USD'; // Assume USD if currency is not specified
      accountBalances[account.name] = convertBetweenCurrencies(startingBalance, accountCurrency, selectedCurrency);
    });

    // Adjust balances with each transaction, converting transaction amounts
    transactions.forEach(transaction => {
      if (transaction.category !== 'Transfer') {
        const convertedAmount = convertBetweenCurrencies(transaction.amount, transaction.currency, selectedCurrency);
        accountBalances[transaction.account] = (accountBalances[transaction.account] || 0) + convertedAmount;
      }
    });

    let totalAssets = 0;
    let totalLiabilities = 0;

    // Sum up the final balances
    Object.values(accountBalances).forEach(balance => {
      if (balance >= 0) {
        totalAssets += balance;
      } else {
        totalLiabilities += Math.abs(balance);
      }
    });

    return {
      assets: totalAssets,
      liabilities: totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };
  }, [transactions, accounts, selectedCurrency, convertBetweenCurrencies]);

  return (
    <ThemedCard>
      <ThemedCardHeader>
        <ThemedCardTitle>Net Worth Statement</ThemedCardTitle>
        <ThemedCardDescription>A summary of your assets and liabilities.</ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <ThemedCard>
            <ThemedCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <ThemedCardTitle className="text-sm font-medium">Total Assets</ThemedCardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </ThemedCardHeader>
            <ThemedCardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(assets)}</div>
            </ThemedCardContent>
          </ThemedCard>
          <ThemedCard>
            <ThemedCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <ThemedCardTitle className="text-sm font-medium">Total Liabilities</ThemedCardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </ThemedCardHeader>
            <ThemedCardContent>
              <div className="text-2xl font-bold text-red-500">{formatCurrency(liabilities)}</div>
            </ThemedCardContent>
          </ThemedCard>
          <ThemedCard>
            <ThemedCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <ThemedCardTitle className="text-sm font-medium">Net Worth</ThemedCardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </ThemedCardHeader>
            <ThemedCardContent>
              <div className="text-2xl font-bold">{formatCurrency(netWorth)}</div>
            </ThemedCardContent>
          </ThemedCard>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default NetWorthStatement;