"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTransactionCSV } from "@/hooks/transactions/useTransactionCSV";

interface ExportTransactionsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const ExportTransactionsDialog: React.FC<ExportTransactionsDialogProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const { exportTransactionsToCsv } = useTransactionCSV();

  const handleExport = () => {
    exportTransactionsToCsv();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Transactions to CSV</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-500">
            Click the button below to export all your transactions to a CSV file.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};