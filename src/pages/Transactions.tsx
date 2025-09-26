import * as React from "react";
import { TransactionDataTable } from "@/components/transactions/TransactionDataTable";
import { columns } from "@/components/transactions/Columns";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Button } from "@/components/ui/button";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import { Skeleton } from "@/components/ui/skeleton";

const TransactionsPage = () => {
  const { transactions, isLoading } = useTransactions();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add Transaction</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <TransactionDataTable columns={columns} data={transactions} />
      )}
      <AddTransactionDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
};

export default TransactionsPage;