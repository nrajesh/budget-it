"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";

interface ExportTransactionsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ExportTransactionsDialog: React.FC<ExportTransactionsDialogProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*");
      if (error) throw error;
      return data;
    },
  });

  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      toast.info("No transactions to export.");
      return;
    }

    const csv = Papa.unparse(transactions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transactions exported successfully.");
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
            Click the button below to export all your transactions to a CSV
            file.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleExport} disabled={isLoadingTransactions}>
            {isLoadingTransactions ? "Loading..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ExportTransactionsDialog };