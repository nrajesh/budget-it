"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScheduledTransaction } from "@/contexts/TransactionsContext"; // Import ScheduledTransaction type
import { format } from "date-fns";

interface ScheduledTransactionTableProps {
  data: ScheduledTransaction[];
  isLoading: boolean;
  onEdit: (transaction: ScheduledTransaction) => void;
  onDelete: (id: string) => Promise<void>;
  formatCurrency: (amount: number, currency: string) => string;
}

export const ScheduledTransactionTable: React.FC<ScheduledTransactionTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  formatCurrency,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete) {
      await onDelete(transactionToDelete);
      setTransactionToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading scheduled transactions...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8">No scheduled transactions found.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{format(new Date(transaction.date), "PPP")}</TableCell>
              <TableCell>{transaction.account}</TableCell>
              <TableCell>{transaction.vendor}</TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(transaction.amount, "USD")} {/* Assuming USD for scheduled, adjust if needed */}
              </TableCell>
              <TableCell>{transaction.frequency}</TableCell>
              <TableCell>
                {transaction.recurrence_end_date ? format(new Date(transaction.recurrence_end_date), "PPP") : "N/A"}
              </TableCell>
              <TableCell className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(transaction)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(transaction.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              scheduled transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};