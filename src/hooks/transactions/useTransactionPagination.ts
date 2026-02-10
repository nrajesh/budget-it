import * as React from "react";
import { Transaction } from "@/data/finance-data";

export const useTransactionPagination = (
  filteredTransactions: Transaction[],
) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const totalPages = React.useMemo(
    () => Math.ceil(filteredTransactions.length / itemsPerPage),
    [filteredTransactions.length, itemsPerPage],
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset pagination when filters or itemsPerPage change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredTransactions, itemsPerPage]);

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    currentTransactions,
  };
};
