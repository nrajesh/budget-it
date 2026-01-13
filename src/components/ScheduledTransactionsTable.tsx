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
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatDateToDDMMYYYY } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "@/contexts/TransactionsContext";

// Define a minimal interface for scheduled transactions as they appear in Analytics
// Adapted from the projected transactions logic
export interface ScheduledTransactionDisplayItem {
    id: string; // might be constructed
    date: string; // ISO date string
    vendor: string;
    account: string;
    category: string;
    amount: number;
    currency: string;
    remarks?: string;
    sub_category?: string;
}

interface ScheduledTransactionsTableProps {
    transactions: ScheduledTransactionDisplayItem[];
}

export function ScheduledTransactionsTable({ transactions }: ScheduledTransactionsTableProps) {
    const { accountCurrencyMap } = useTransactions();
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
        navigate('/transactions', { state: { filterCategory: categoryName } });
    };

    const indexOfLastTransaction = currentPage * transactionsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
    const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

    const totalPages = Math.ceil(transactions.length / transactionsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Reset pagination when data changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [transactions]);

    return (
        <ThemedCard>
            <ThemedCardHeader>
                <ThemedCardTitle>Scheduled Transactions</ThemedCardTitle>
                <ThemedCardDescription>Upcoming transactions based on your schedule.</ThemedCardDescription>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                        No upcoming transactions found for the selected period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentTransactions.map((transaction, idx) => {
                                    // Using index in key because these might be projected instances without unique DB IDs
                                    const key = transaction.id || `scheduled-${idx}`;
                                    const currentAccountCurrency = accountCurrencyMap.get(transaction.account) || transaction.currency;

                                    return (
                                        <TableRow key={key}>
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
