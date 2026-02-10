import * as React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
  ThemedCardFooter,
} from "@/components/ThemedCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, badgeVariants } from "@/components/ui/badge";
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
import { slugify, formatDateToDDMMYYYY, cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface RecentTransactionsProps {
  transactions: Transaction[]; // These are transactions filtered by account
  selectedCategories: string[];
}

export function RecentTransactions({
  transactions,
  selectedCategories,
}: RecentTransactionsProps) {
  const {
    transactions: allTransactions,
    accountCurrencyMap,
    accounts,
  } = useTransactions();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = React.useState(1);
  const transactionsPerPage = 10;

  const handleAccountClick = (accountName: string) => {
    navigate("/transactions", { state: { filterAccount: accountName } });
  };

  const handleVendorClick = (vendorName: string) => {
    const isAccount = accountCurrencyMap.has(vendorName);
    const filterKey = isAccount ? "filterAccount" : "filterVendor";
    navigate("/transactions", { state: { [filterKey]: vendorName } });
  };

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === "Transfer") return;
    navigate("/transactions", { state: { filterCategory: categoryName } });
  };

  /*
   * Calculate running balances per account in their native currency.
   * We iterate through ALL transactions chronologically to build the correct historical state.
   */
  const transactionsWithCorrectBalance = React.useMemo(() => {
    // 1. Define the Master Sort Comparator (Descending / Newest First)
    // This is the SINGLE source of truth for display order
    const sortDesc = (a: Transaction, b: Transaction) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;

      const createdDiff =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (createdDiff !== 0) return createdDiff;

      return b.id.localeCompare(a.id);
    };

    // 2. Sort ALL transactions Descending (Master Display Order)
    // We merge global transactions with the passed 'transactions' prop.
    const combinedTransactions = (() => {
      const seenIds = new Set(allTransactions.map((t) => t.id));
      const uniqueExtras = transactions.filter((t) => !seenIds.has(t.id));
      return [...allTransactions, ...uniqueExtras];
    })();

    const allSortedDesc = [...combinedTransactions].sort(sortDesc);

    // 3. Calculate balances by processing Oldest -> Newest (Reverse of Master Display)
    // This ensures calculation perfectly opposes the display order
    const allSortedAsc = [...allSortedDesc].reverse();

    const balanceMap = new Map<string, number>();
    const accountRunningBalances = new Map<string, number>();

    // Initialize with starting balances
    accounts.forEach((acc) => {
      if (acc.name) {
        // console.log(`[BalanceCalc] Initializing ${acc.name} with ${acc.starting_balance}`);
        accountRunningBalances.set(
          acc.name.trim().toLowerCase(),
          acc.starting_balance || 0,
        );
      }
    });

    allSortedAsc.forEach((t) => {
      const normalizedAccountName = t.account.trim().toLowerCase();
      const currentBalance =
        accountRunningBalances.get(normalizedAccountName) || 0;
      // We assume transaction amount is already in the account's currency
      const newBalance = currentBalance + t.amount;

      accountRunningBalances.set(normalizedAccountName, newBalance);
      balanceMap.set(t.id, newBalance);
    });

    // Debug: Log top 3 transactions and their balances
    // console.log("[BalanceCalc] Top 3 Sorted Transactions:", allSortedDesc.slice(0, 3).map(t => ({
    //   id: t.id,
    //   date: t.date,
    //   created_at: t.created_at,
    //   amount: t.amount,
    //   bal: balanceMap.get(t.id)
    // })));

    // 4. Attach balances to the VIEW transactions and ensure they are sorted by Master Sort
    // This guarantees visual consistency with the calculation
    return transactions
      .map((t) => ({
        ...t,
        runningBalance: balanceMap.get(t.id) ?? 0,
      }))
      .sort(sortDesc);
  }, [allTransactions, transactions, accounts]);

  // Filter transactions for display based on selected categories
  const displayTransactions = React.useMemo(() => {
    if (selectedCategories.length === 0) {
      // If no categories are selected, show all transactions
      return transactionsWithCorrectBalance;
    }
    return transactionsWithCorrectBalance.filter((t) =>
      selectedCategories.includes(slugify(t.category)),
    );
  }, [transactionsWithCorrectBalance, selectedCategories]);

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = displayTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction,
  );

  const totalPages = Math.ceil(
    displayTransactions.length / transactionsPerPage,
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [displayTransactions]);

  return (
    <ThemedCard>
      <ThemedCardHeader>
        <ThemedCardTitle>Recent Transactions</ThemedCardTitle>
        <ThemedCardDescription>
          Your most recent transactions, filtered by selected accounts and
          categories.
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor / Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sub-category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-4 text-muted-foreground"
                  >
                    No transactions found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                currentTransactions.map((transaction) => {
                  const currentAccountCurrency =
                    accountCurrencyMap.get(transaction.account) ||
                    transaction.currency;
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {formatDateToDDMMYYYY(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleVendorClick(transaction.vendor)}
                          className="font-medium cursor-pointer hover:text-primary hover:underline bg-transparent border-0 p-0 text-left"
                          aria-label={`Filter by vendor ${transaction.vendor}`}
                        >
                          {transaction.vendor}
                        </button>
                        <button
                          onClick={() =>
                            handleAccountClick(transaction.account)
                          }
                          className="text-sm text-muted-foreground cursor-pointer hover:text-primary hover:underline bg-transparent border-0 p-0 text-left block"
                          aria-label={`Filter by account ${transaction.account}`}
                        >
                          {transaction.account}
                        </button>
                      </TableCell>
                      <TableCell>
                        {transaction.category === "Transfer" ? (
                          <Badge variant="outline">
                            {transaction.category}
                          </Badge>
                        ) : (
                          <button
                            onClick={() =>
                              handleCategoryClick(transaction.category)
                            }
                            className={cn(
                              badgeVariants({ variant: "outline" }),
                              "cursor-pointer hover:border-primary bg-transparent",
                            )}
                            aria-label={`Filter by category ${transaction.category}`}
                          >
                            {transaction.category}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.sub_category && (
                          <Badge variant="secondary" className="text-xs">
                            {transaction.sub_category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(
                          transaction.amount,
                          currentAccountCurrency,
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(
                          transaction.runningBalance,
                          currentAccountCurrency,
                        )}
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
                  onClick={
                    currentPage === 1
                      ? undefined
                      : () => paginate(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={
                    currentPage === totalPages
                      ? undefined
                      : () => paginate(currentPage + 1)
                  }
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
