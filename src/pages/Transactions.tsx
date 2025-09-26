import * as React from "react";
import { TransactionDataTable } from "@/components/transactions/TransactionDataTable";
import { columns } from "@/components/transactions/Columns";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { useTransactionData } from "@/hooks/transactions/useTransactionData";
import { Transaction } from "@/data/finance-data";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { useTransactions } from "@/contexts/TransactionsContext";
import LoadingOverlay from "@/components/LoadingOverlay";

const Transactions = () => {
  const filterProps = useTransactionFilters();
  const dataProps = useTransactionData(filterProps);
  const { isLoadingTransactions, isLoadingVendors, isLoadingAccounts, isLoadingCategories } = useTransactions();

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const isLoading = isLoadingTransactions || isLoadingVendors || isLoadingAccounts || isLoadingCategories;

  return (
    <div className="flex-1 space-y-4">
      <LoadingOverlay isLoading={isLoading} message="Loading transactions..." />
      <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <TransactionFilters
            {...filterProps}
            onDateChange={filterProps.setDateRange}
            onResetFilters={filterProps.handleResetFilters}
          />
        </CardHeader>
        <CardContent>
          <TransactionDataTable
            columns={columns({ onEdit: handleEdit })}
            data={dataProps.filteredTransactions}
          />
        </CardContent>
      </Card>
      {selectedTransaction && (
        <EditTransactionDialog
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;