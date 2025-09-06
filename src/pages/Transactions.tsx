import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Transaction } from "@/data/finance-data";
import EditTransactionDialog from "@/components/EditTransactionDialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import new modular components and hook
import { useTransactionManagement } from "@/hooks/useTransactionManagement";
import { TransactionFilters } from "@/components/transactions/TransactionFilters.tsx";
import { TransactionActions } from "@/components/transactions/TransactionActions.tsx";
import { TransactionsTable } from "@/components/transactions/TransactionsTable.tsx";
import LoadingOverlay from "@/components/LoadingOverlay"; // Import LoadingOverlay

const TransactionsPage = () => {
  const {
    // States
    currentPage,
    itemsPerPage,
    searchTerm,
    selectedAccounts,
    selectedCategories,
    dateRange,
    isRefreshing,
    isImporting,
    selectedTransactionIds,
    isBulkDeleteConfirmOpen,
    fileInputRef,
    availableAccountOptions,
    availableCategoryOptions,
    filteredTransactions,
    totalPages,
    startIndex,
    endIndex,
    currentTransactions,
    numSelected,
    accountCurrencyMap,
    formatCurrency,
    isAllSelectedOnPage,

    // Setters
    setCurrentPage,
    setItemsPerPage,
    setSearchTerm,
    setSelectedAccounts,
    setSelectedCategories,
    setDateRange,
    setIsBulkDeleteConfirmOpen,

    // Handlers
    handleResetFilters,
    handleSelectOne,
    handleSelectAll,
    handleBulkDelete,
    handleRefresh,
    handleImportClick,
    handleFileChange,
    handleExportClick,
  } = useTransactionManagement();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <LoadingOverlay isLoading={isImporting || isRefreshing} message={isImporting ? "Importing transactions..." : "Refreshing transactions..."} />
      <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              All Transactions
              <TransactionActions
                numSelected={numSelected}
                isImporting={isImporting}
                isRefreshing={isRefreshing}
                onImportClick={handleImportClick}
                onExportClick={handleExportClick}
                onRefresh={handleRefresh}
                onBulkDeleteClick={() => setIsBulkDeleteConfirmOpen(true)}
              />
            </CardTitle>
            <TransactionFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              availableAccountOptions={availableAccountOptions}
              selectedAccounts={selectedAccounts}
              setSelectedAccounts={setSelectedAccounts}
              availableCategoryOptions={availableCategoryOptions}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              dateRange={dateRange}
              onDateChange={setDateRange}
              onResetFilters={handleResetFilters}
            />
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".csv"
            />
            <TransactionsTable
              currentTransactions={currentTransactions}
              accountCurrencyMap={accountCurrencyMap}
              formatCurrency={formatCurrency}
              selectedTransactionIds={selectedTransactionIds}
              handleSelectOne={handleSelectOne}
              handleSelectAll={handleSelectAll}
              isAllSelectedOnPage={isAllSelectedOnPage}
              handleRowClick={handleRowClick}
            />
          </CardContent>
          <CardFooter className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </span>
              <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>
        {selectedTransaction && (
          <EditTransactionDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            transaction={selectedTransaction}
          />
        )}
        <ConfirmationDialog
          isOpen={isBulkDeleteConfirmOpen}
          onOpenChange={setIsBulkDeleteConfirmOpen}
          onConfirm={handleBulkDelete}
          title={`Are you sure you want to delete ${numSelected} transactions?`}
          description="This action cannot be undone. All selected transactions and their associated transfer entries (if any) will be permanently deleted."
          confirmText="Delete Selected"
        />
      </div>
    </div>
  );
};

export default TransactionsPage;