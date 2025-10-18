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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";

interface ImportTransactionsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ImportTransactionsDialog: React.FC<ImportTransactionsDialogProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const importTransactionsMutation = useMutation({
    mutationFn: async (transactionsToInsert: any[]) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert(transactionsToInsert);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transactions imported successfully.");
      setIsOpen(false);
      setFile(null);
    },
    onError: (error) => {
      toast.error("Failed to import transactions.");
      console.error("Import error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a CSV file to import.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data.map((row: any) => ({
          date: row.Date,
          account: row.Account,
          vendor: row.Vendor,
          category: row.Category,
          amount: parseFloat(row.Amount),
          remarks: row.Remarks,
          currency: row.Currency || "USD", // Default to USD if not provided
        }));
        importTransactionsMutation.mutate(parsedData);
      },
      error: (error: any) => {
        toast.error("Error parsing CSV file.");
        console.error("CSV parse error:", error);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={importTransactionsMutation.isPending}>
              Import
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { ImportTransactionsDialog };