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
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    remarks?: string | null; // Allow null to match DB
    sub_category?: string;
}

interface ScheduledTransactionsTableProps {
    transactions: ScheduledTransactionDisplayItem[];
    onEdit?: (transaction: any) => void;
    onDelete?: (id: string) => void;
}

export function ScheduledTransactionsTable({ transactions, onEdit, onDelete }: ScheduledTransactionsTableProps) {
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
                                <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">Date</TableHead>
                                <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">Vendor / Account</TableHead>
                                <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">Category</TableHead>
                                <TableHead className="text-slate-800 dark:text-slate-200 font-semibold">Sub-category</TableHead>
                                <TableHead className="text-right text-slate-800 dark:text-slate-200 font-semibold">Amount</TableHead>
                                {(onEdit || onDelete) && <TableHead className="w-[50px]"></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
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
                                            <TableCell className="text-slate-700 dark:text-slate-300">{formatDateToDDMMYYYY(transaction.date)}</TableCell>
                                            <TableCell>
                                                <div onClick={() => handleVendorClick(transaction.vendor)} className="font-medium cursor-pointer hover:text-primary hover:underline text-slate-700 dark:text-slate-200">{transaction.vendor}</div>
                                                <div onClick={() => handleAccountClick(transaction.account)} className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary hover:underline">{transaction.account}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" onClick={() => handleCategoryClick(transaction.category)} className={`text-slate-700 dark:text-slate-300 ${transaction.category !== 'Transfer' ? "cursor-pointer hover:border-primary" : ""}`}>{transaction.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {transaction.sub_category && <Badge variant="outline" className="text-xs text-slate-700 dark:text-slate-300 font-normal">{transaction.sub_category}</Badge>}
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {formatCurrency(transaction.amount, currentAccountCurrency)}
                                            </TableCell>
                                            {(onEdit || onDelete) && (
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            {onEdit && <DropdownMenuItem onClick={() => onEdit(transaction)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                                                            {onDelete && <DropdownMenuItem onClick={() => onDelete(transaction.id)} className="text-destructive"><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            )}
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
