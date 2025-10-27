"use client";

import React, { useState } from "react";
import { useTransactionManagement } from "@/hooks/useTransactionManagement";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Transaction } from "@/types/finance";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const Transactions = () => {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const {
    currentTransactions,
    isLoading,
    error,
    accountCurrencyMap,
    // Selection
    selectedTransactionIds,
    handleSelectOne,
    handleSelectAll,
    isAllSelectedOnPage,
  } = useTransactionManagement();

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading transactions: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={currentTransactions}
            onEdit={handleEditTransaction}
            selectedTransactionIds={selectedTransactionIds}
            handleSelectOne={handleSelectOne}
            handleSelectAll={() => handleSelectAll()}
            isAllSelectedOnPage={isAllSelectedOnPage}
            accountCurrencyMap={accountCurrencyMap}
            formatCurrency={formatCurrency}
          />
        </CardContent>
        <CardFooter>
          {/* Pagination will go here */}
        </CardFooter>
      </Card>

      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}
        />
      )}
    </div>
  );
};

export default Transactions;