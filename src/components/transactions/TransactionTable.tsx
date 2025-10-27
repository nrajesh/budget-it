"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { format } from 'date-fns';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  selectedTransactionIds: string[];
  handleSelectOne: (id: string) => void;
  handleSelectAll: () => void;
  isAllSelectedOnPage: boolean;
  accountCurrencyMap: Map<string, string>;
  formatCurrency: (amount: number, currency: string) => string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  selectedTransactionIds,
  handleSelectOne,
  handleSelectAll,
  isAllSelectedOnPage,
  accountCurrencyMap,
  formatCurrency,
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={isAllSelectedOnPage}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <Checkbox
                  checked={selectedTransactionIds.includes(transaction.id)}
                  onCheckedChange={() => handleSelectOne(transaction.id)}
                  aria-label={`Select transaction ${transaction.id}`}
                />
              </TableCell>
              <TableCell>{format(new Date(transaction.date), 'PP')}</TableCell>
              <TableCell>{transaction.account}</TableCell>
              <TableCell>{transaction.vendor}</TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(transaction.amount, accountCurrencyMap.get(transaction.account) || transaction.currency)}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};