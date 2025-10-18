"use client";

import React, { useState, useMemo } from "react";
import { useScheduledTransactionManagement } from "@/hooks/useScheduledTransactionManagement";
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCcw } from "lucide-react";
import { ScheduledTransactionTable } from "@/components/ScheduledTransactionTable";
import { AddEditScheduledTransactionDialog } from "@/components/AddEditScheduledTransactionDialog";
import { ScheduledTransaction, Payee, Category } from "@/contexts/TransactionsContext"; // Corrected import types

const ScheduledTransactionsPage = () => {
  const {
    scheduledTransactions,
    isLoadingScheduledTransactions,
    saveScheduledTransaction,
    deleteScheduledTransaction,
    allPayees,
    accounts,
    vendors,
    categories,
    isLoadingAccounts,
    isLoadingVendors,
    isLoadingCategories,
    isSaving,
    isDeleting,
    refetchScheduledTransactions,
  } = useScheduledTransactionManagement();
  const { formatCurrency } = useCurrency();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScheduledTransaction, setSelectedScheduledTransaction] = useState<ScheduledTransaction | undefined>(undefined);

  const handleAddScheduledTransaction = () => {
    setSelectedScheduledTransaction(undefined);
    setIsDialogOpen(true);
  };

  const handleEditScheduledTransaction = (transaction: ScheduledTransaction) => {
    setSelectedScheduledTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleRefresh = () => {
    refetchScheduledTransactions();
  };

  const isLoading = isLoadingScheduledTransactions || isLoadingAccounts || isLoadingVendors || isLoadingCategories;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Scheduled Transactions</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Scheduled Transactions</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddScheduledTransaction}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Scheduled Transaction
            </Button>
          </div>
        </div>

        <ScheduledTransactionTable
          data={scheduledTransactions || []}
          isLoading={isLoadingScheduledTransactions}
          onEdit={handleEditScheduledTransaction}
          onDelete={deleteScheduledTransaction}
          formatCurrency={formatCurrency}
        />
      </div>

      <AddEditScheduledTransactionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        scheduledTransaction={selectedScheduledTransaction}
        onSave={saveScheduledTransaction}
        isSubmitting={isSaving}
        accounts={accounts || []}
        allPayees={allPayees}
        categories={categories || []}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ScheduledTransactionsPage;