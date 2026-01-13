import * as React from "react";
import { ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle, ThemedCardFooter } from "@/components/ThemedCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { type Transaction } from "@/data/finance-data";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { slugify, formatDateToDDMMYYYY } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface RecentTransactionsProps {
  transactions: Transaction[]; // These are transactions filtered by account
  selectedCategories: string[];
}

export function RecentTransactions({ transactions, selectedCategories }: RecentTransactionsProps) {
  const { transactions: allTransactions, accountCurrencyMap, accounts } = useTransactions();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = React.useState(1);
  const transactionsPerPage = 10;

  const handleAccountClick = (accountName: string) => {
    navigate('/transactions', { state: { filterAccount: accountName } });
  };

  const handleVendorClick = (vendorName: string) => {
    const isAccount = accountCurrencyMap.has(vendorName);
    const filterKey = isAccount ? 'filterAccount' : 'filterVendor';
    navigate('/transactions', { state: { [filterKey]: vendorName } });
  };

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === 'Transfer') return;
    navigate('/transactions', { state: { filterCategory: categoryName } });
  };

  /*
   * Calculate running balances per account in their native currency.
   * We iterate through ALL transactions chronologically to build the correct historical state.
   */
  const transactionsWithCorrectBalance = React.useMemo(() => {
    const balanceMap = new Map<string, number>();
    const accountRunningBalances = new Map<string, number>();

    // Initialize with starting balances
    accounts.forEach(acc => {
      accountRunningBalances.set(acc.name, acc.starting_balance || 0);
    });

    // Process all transactions chronologically
    const sortedTransactions = [...allTransactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTransactions.forEach(t => {
      const currentBalance = accountRunningBalances.get(t.account) || 0;
      // We assume transaction amount is already in the account's currency
      // If it's a transfer, we might need special handling, but usually the amount reflects the impact on the account
      const newBalance = currentBalance + t.amount;

      accountRunningBalances.set(t.account, newBalance);
      balanceMap.set(t.id, newBalance);
    });

    // Attach the correct historical balance to the filtered transactions passed via props
    // And ensure we display the specific account currency for the balance
    return transactions
      .map(t => ({
        ...t,
        runningBalance: balanceMap.get(t.id) ?? 0,
        // Ensure we pass the account currency for display if needed later, 
        // though we look it up in the render function usually.
      }))
      // Sort for display, most recent first
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTransactions, transactions, accounts]);

  // Filter transactions for display based on selected categories
  const displayTransactions = React.useMemo(() => {
    if (selectedCategories.length === 0) {
      // If no categories are selected, show all transactions
      return transactionsWithCorrectBalance;
    }
    return transactionsWithCorrectBalance.filter(t => selectedCategories.includes(slugify(t.category)));
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
    <ThemedCard>
      <ThemedCardHeader>
        <ThemedCardTitle>Recent Transactions</ThemedCardTitle>
        <ThemedCardDescription>Your most recent transactions, filtered by selected accounts and categories.</ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Vendor / Account</TableHead><TableHead>Category</TableHead><TableHead>Sub-category</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No transactions found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                currentTransactions.map((transaction) => {
                  const currentAccountCurrency = accountCurrencyMap.get(transaction.account) || transaction.currency;
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDateToDDMMYYYY(transaction.date)}</TableCell>
                      <TableCell>
                        <div onClick={() => handleVendorClick(transaction.vendor)} className="font-medium cursor-pointer hover:text-primary hover:underline">{transaction.vendor}</div>
                        <div onClick={() => handleAccountClick(transaction.account)} className="text-sm text-muted-foreground cursor-pointer hover:text-primary hover:underline">{transaction.account}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" onClick={() => handleCategoryClick(transaction.category)} className={transaction.category !== 'Transfer' ? "cursor-pointer hover:border-primary" : ""}>{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.sub_category && <Badge variant="secondary" className="text-xs">{transaction.sub_category}</Badge>}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.amount, currentAccountCurrency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.runningBalance, currentAccountCurrency)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </ThemedCardContent>
      {totalPages > 1 && (
        <ThemedCardFooter className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={currentPage === 1 ? undefined : () => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={currentPage === totalPages ? undefined : () => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </ThemedCardFooter>
      )}
    </ThemedCard>
  );
}