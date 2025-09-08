import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Transaction } from "@/data/finance-data";
import { formatDateToDDMMYYYY } from "@/lib/utils";

interface TransactionsTableProps {
  currentTransactions: Transaction[];
  accountCurrencyMap: Map<string, string>;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  selectedTransactionIds: string[];
  handleSelectOne: (id: string) => void;
  handleSelectAll: (checked: boolean) => void;
  isAllSelectedOnPage: boolean;
  handleRowClick: (transaction: Transaction) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  currentTransactions,
  accountCurrencyMap,
  formatCurrency,
  selectedTransactionIds,
  handleSelectOne,
  handleSelectAll,
  isAllSelectedOnPage,
  handleRowClick,
}) => {
  return (
    <div className="border rounded-md overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={isAllSelectedOnPage}
                onCheckedChange={handleSelectAll}
                aria-label="Select all transactions on current page"
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentTransactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                No transactions found matching your filters.
              </TableCell>
            </TableRow>
          ) : (
            currentTransactions.map((transaction) => {
              const currentAccountCurrency = accountCurrencyMap.get(transaction.account) || transaction.currency;
              return (
                <TableRow key={transaction.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactionIds.includes(transaction.id)}
                      onCheckedChange={() => handleSelectOne(transaction.id)}
                      aria-label={`Select transaction ${transaction.id}`}
                    />
                  </TableCell>
                  <TableCell onDoubleClick={() => handleRowClick(transaction)} className="cursor-pointer group-hover:bg-accent/50">
                    {formatDateToDDMMYYYY(transaction.date)}
                  </TableCell>
                  <TableCell onDoubleClick={() => handleRowClick(transaction)} className="cursor-pointer group-hover:bg-accent/50">
                    {transaction.account}
                  </TableCell>
                  <TableCell onDoubleClick={() => handleRowClick(transaction)} className="cursor-pointer group-hover:bg-accent/50">
                    {transaction.vendor}
                  </TableCell>
                  <TableCell onDoubleClick={() => handleRowClick(transaction)} className="cursor-pointer group-hover:bg-accent/50">
                    {transaction.category}
                  </TableCell>
                  <TableCell onDoubleClick={() => handleRowClick(transaction)} className={`text-right ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'} cursor-pointer group-hover:bg-accent/50`}>
                    {formatCurrency(transaction.amount, currentAccountCurrency)}
                  </TableCell>
                  <TableCell onDoubleClick={() => handleRowClick(transaction)} className="cursor-pointer group-hover:bg-accent/50">
                    {transaction.remarks}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};