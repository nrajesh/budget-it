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
import { Budget, Category } from "@/contexts/TransactionsContext";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency"; // Corrected import path
import { useTransactions } from "@/contexts/TransactionsContext";

interface BudgetsTableProps {
  data: Budget[];
  isLoading: boolean;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => Promise<void>;
}

export const BudgetsTable: React.FC<BudgetsTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const { formatCurrency } = useCurrency();
  const { categories } = useTransactions();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

  const getCategoryName = (categoryId: string) => {
    return categories?.find(cat => cat.id === categoryId)?.name || "N/A";
  };

  const handleDeleteClick = (id: string) => {
    setBudgetToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (budgetToDelete) {
      await onDelete(budgetToDelete);
      setBudgetToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading budgets...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8">No budgets found.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Target Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell>{getCategoryName(budget.category_id)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(budget.target_amount, budget.currency)}
              </TableCell>
              <TableCell>{budget.frequency}</TableCell>
              <TableCell>{format(new Date(budget.start_date), "PPP")}</TableCell>
              <TableCell>
                {budget.end_date ? format(new Date(budget.end_date), "PPP") : "N/A"}
              </TableCell>
              <TableCell>{budget.is_active ? "Yes" : "No"}</TableCell>
              <TableCell className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(budget)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(budget.id)}
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
              budget.
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