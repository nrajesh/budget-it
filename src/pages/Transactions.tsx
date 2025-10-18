"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { toast } from "sonner";
import { PlusCircle, Upload, Download, RefreshCcw } from "lucide-react";
import TransactionDialog from "@/components/TransactionDialog";
import { ImportTransactionsDialog } from "@/components/ImportTransactionsDialog";
import { ExportTransactionsDialog } from "@/components/ExportTransactionsDialog";
import { TransactionTable } from "@/components/TransactionTable";
import { useTransactions } from "@/contexts/TransactionsContext"; // Import the custom hook

const Transactions = () => {
  const {
    transactions,
    isLoadingTransactions,
    deleteTransaction,
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    selectedAccount,
    setSelectedAccount,
    selectedCategory,
    setSelectedCategory,
    selectedVendor,
    setSelectedVendor,
    handleRefresh,
    handleResetFilters,
    accounts,
    isLoadingAccounts,
    categories,
    isLoadingCategories,
    vendors,
    isLoadingVendors,
  } = useTransactions(); // Use the custom hook

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteTransaction(id);
  };

  const filteredTransactions = useMemo(() => {
    return transactions || [];
  }, [transactions]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Transactions</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsTransactionDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end mb-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <Input
              id="search"
              placeholder="Search vendor or remarks"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <DatePickerWithRange
              id="date-range"
              date={dateRange}
              setDate={setDateRange}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="account-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Account
            </label>
            <Select
              value={selectedAccount}
              onValueChange={setSelectedAccount}
            >
              <SelectTrigger id="account-filter" className="w-full">
                <SelectValue placeholder="Filter by Account" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAccounts ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.name}>
                      {account.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger id="category-filter" className="w-full">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCategories ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  categories?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="vendor-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <Select
              value={selectedVendor}
              onValueChange={setSelectedVendor}
            >
              <SelectTrigger id="vendor-filter" className="w-full">
                <SelectValue placeholder="Filter by Vendor" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingVendors ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.name}>
                      {vendor.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" onClick={handleResetFilters} className="mt-2">
          Reset Filters
        </Button>
      </div>

      <TransactionTable
        transactions={filteredTransactions}
        isLoading={isLoadingTransactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionDialog
        isOpen={isTransactionDialogOpen}
        setIsOpen={setIsTransactionDialogOpen}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
      <ImportTransactionsDialog
        isOpen={isImportDialogOpen}
        setIsOpen={setIsImportDialogOpen}
      />
      <ExportTransactionsDialog
        isOpen={isExportDialogOpen}
        setIsOpen={setIsExportDialogOpen}
      />
    </div>
  );
};

export default Transactions;