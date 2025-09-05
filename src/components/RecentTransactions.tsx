import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { type Transaction } from "@/data/finance-data";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RecentTransactionsProps {
  transactions: Transaction[]; // These are transactions filtered by account
  selectedCategories: string[];
}

export function RecentTransactions({ transactions, selectedCategories }: RecentTransactionsProps) {
  const { transactions: allTransactions } = useTransactions(); // Get all transactions for balance calculation
  const { formatCurrency } = useCurrency();
  const [currentPage, setCurrentPage] = React.useState(1);
  const transactionsPerPage = 10;

  const transactionsWithCorrectBalance = React.useMemo(() => {
    let runningBalance = 0;
    const balanceMap = new Map<string, number>();

    // Calculate running balance for ALL transactions to get a historical truth
    [...allTransactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(t => {
        if (t.category !== 'Transfer') {
          runningBalance += t.amount;
        }
        balanceMap.set(t.id, runningBalance);
      });

    // Attach the correct historical balance to the filtered transactions passed via props
    return transactions
      .map(t => ({
        ...t,
        runningBalance: balanceMap.get(t.id) ?? 0,
      }))
      // Sort for display, most recent first
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTransactions, transactions]);

  // Filter transactions for display based on selected categories
  const displayTransactions = React.useMemo(() => {
    return transactionsWithCorrectBalance.filter(t => selectedCategories.includes(t.category));
  }, [transactionsWithCorrectBalance, selectedCategories]);

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = displayTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  const totalPages = Math.ceil(displayTransactions.length / transactionsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [displayTransactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your most recent transactions, filtered by selected accounts and categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor / Account</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No transactions found for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              currentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="font-medium">{transaction.vendor}</div>
                    <div className="text-sm text-muted-foreground">{transaction.account}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(transaction.runningBalance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={currentPage === 1 ? undefined : () => paginate(currentPage - 1)} 
                  disabled={currentPage === 1} 
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => paginate(page)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={currentPage === totalPages ? undefined : () => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
    </Card>
  );
}