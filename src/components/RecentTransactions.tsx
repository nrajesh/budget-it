"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useTransactions, Transaction } from "@/contexts/TransactionsContext"; // Import Transaction type from context
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path

interface RecentTransactionsProps {
  transactions: Transaction[];
  selectedCategories: string[];
}

export function RecentTransactions({ transactions, selectedCategories }: RecentTransactionsProps) {
  const { accountCurrencyMap } = useTransactions();
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();

  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t =>
      selectedCategories.length === 0 || selectedCategories.includes(t.category)
    ).slice(0, 5); // Show only 5 recent transactions
  }, [transactions, selectedCategories]);

  if (filteredTransactions.length === 0) {
    return <p className="text-center text-gray-500">No recent transactions found.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{format(new Date(transaction.date), "MMM dd")}</TableCell>
              <TableCell>{transaction.vendor}</TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(
                  convertBetweenCurrencies(
                    transaction.amount,
                    transaction.currency,
                    selectedCurrency,
                    accountCurrencyMap
                  ),
                  selectedCurrency
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}