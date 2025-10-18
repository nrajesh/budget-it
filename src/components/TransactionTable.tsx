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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2 } from "lucide-react";
import { Transaction } from "@/contexts/TransactionsContext";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path
import { useTransactions } from "@/contexts/TransactionsContext";

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => Promise<void>;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } = useCurrency();
  const { accountCurrencyMap } = useTransactions();

  if (isLoading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  if (!transactions || transactions.length === 0) {
    return <div className="text-center py-8">No transactions found.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={false} // Placeholder for selection logic
                onCheckedChange={() => {}}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <Checkbox
                  checked={false} // Placeholder for selection logic
                  onCheckedChange={() => {}}
                  aria-label="Select row"
                />
              </TableCell>
              <TableCell>{format(new Date(transaction.date), "PPP")}</TableCell>
              <TableCell>{transaction.account}</TableCell>
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
              <TableCell>{transaction.remarks}</TableCell>
              <TableCell className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(transaction)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(transaction.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};