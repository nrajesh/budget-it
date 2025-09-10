import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Transaction } from "@/data/finance-data";

export const useTransactionSelection = (currentTransactions: Transaction[], allTransactions: Transaction[]) => {
  const { deleteMultipleTransactions } = useTransactions();
  const [selectedTransactionIds, setSelectedTransactionIds] = React.useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);

  // Memoize selectable transactions on the current page (excluding scheduled origins)
  const selectableTransactionsOnPage = React.useMemo(() => {
    return currentTransactions.filter(t => !t.is_scheduled_origin);
  }, [currentTransactions]);

  const handleSelectOne = React.useCallback((id: string) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(id) ? prev.filter((_id) => _id !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = React.useCallback((checked: boolean) => {
    if (checked) {
      setSelectedTransactionIds(selectableTransactionsOnPage.map((t) => t.id));
    } else {
      setSelectedTransactionIds([]);
    }
  }, [selectableTransactionsOnPage]);

  const isAllSelectedOnPage = React.useMemo(() => {
    if (selectableTransactionsOnPage.length === 0) {
      return false;
    }
    return selectableTransactionsOnPage.every((t) => selectedTransactionIds.includes(t.id));
  }, [selectableTransactionsOnPage, selectedTransactionIds]);

  const handleBulkDelete = React.useCallback(() => {
    const transactionsToDelete = selectedTransactionIds.map(id => {
      const transaction = allTransactions.find(t => t.id === id);
      return { id, transfer_id: transaction?.transfer_id };
    });
    deleteMultipleTransactions(transactionsToDelete);
    setSelectedTransactionIds([]);
    setIsBulkDeleteConfirmOpen(false);
  }, [selectedTransactionIds, allTransactions, deleteMultipleTransactions]);

  const numSelected = selectedTransactionIds.length;

  // Reset selection when currentTransactions change (e.g., due to pagination or filters)
  React.useEffect(() => {
    setSelectedTransactionIds([]);
  }, [currentTransactions]);

  return {
    selectedTransactionIds,
    setSelectedTransactionIds,
    isBulkDeleteConfirmOpen,
    setIsBulkDeleteConfirmOpen,
    handleSelectOne,
    handleSelectAll,
    isAllSelectedOnPage,
    handleBulkDelete,
    numSelected,
  };
};