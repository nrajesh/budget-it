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
import { Transaction } from "@/types"; // Corrected import
import { formatDateToDDMMYYYY } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CalendarCheck } from "lucide-react"; // Import CalendarCheck icon

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
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
    return d;
  }, []);

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
              const isScheduledOrigin = transaction.is_scheduled_origin; // Use the new flag
              const transactionDate = new Date(transaction.date);
              const isFutureTransaction = transactionDate > today; // Check if date is in the future

              // Only grey out if it's from a scheduled origin AND it's in the future
              const shouldBeGreyedOut = isScheduledOrigin && isFutureTransaction;

              const rowClassName = cn("group", shouldBeGreyedOut && "text-muted-foreground italic");
              const cellClassName = cn(
                "group-hover:bg-accent/50",
                !shouldBeGreyedOut && "cursor-pointer" // Only allow click if not greyed out
              );

              return (
                <TableRow key={transaction.id} className={rowClassName}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactionIds.includes(transaction.id)}
                      onCheckedChange={() => handleSelectOne(transaction.id)}
                      aria-label={`Select transaction ${transaction.id}`}
                      disabled={shouldBeGreyedOut} // Disable checkbox if it's a future scheduled transaction
                    />
                  </TableCell>
                  <TableCell onDoubleClick={shouldBeGreyedOut ? undefined : () => handleRowClick(transaction)} className={cellClassName}>
                    <div className="flex items-center gap-1">
                      {isScheduledOrigin && <CalendarCheck className="h-4 w-4 text-muted-foreground" />}
                      {formatDateToDDMMYYYY(transaction.date)}
                    </div>
                  </TableCell>
                  <TableCell onDoubleClick={shouldBeGreyedOut ? undefined : () => handleRowClick(transaction)} className={cellClassName}>
                    {transaction.account}
                  </TableCell>
                  <TableCell onDoubleClick={shouldBeGreyedOut ? undefined : () => handleRowClick(transaction)} className={cellClassName}>
                    {transaction.vendor}
                  </TableCell>
                  <TableCell onDoubleClick={shouldBeGreyedOut ? undefined : () => handleRowClick(transaction)} className={cellClassName}>
                    {transaction.category}
                  </TableCell>
                  <TableCell onDoubleClick={shouldBeGreyedOut ? undefined : () => handleRowClick(transaction)} className={cn(
                    'text-right',
                    !shouldBeGreyedOut && (transaction.amount < 0 ? 'text-red-500' : 'text-green-500'),
                    cellClassName
                  )}>
                    {formatCurrency(transaction.amount, currentAccountCurrency)}
                  </TableCell>
                  <TableCell onDoubleClick={shouldBeGreyedOut ? undefined : () => handleRowClick(transaction)} className={cellClassName}>
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