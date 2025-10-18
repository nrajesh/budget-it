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
import { Payee } from "@/contexts/TransactionsContext"; // Import Payee type
import { usePayeeManagement } from "@/hooks/usePayeeManagement";

interface PayeeTableProps {
  entityType: "account" | "vendor";
  entityNamePlural: "accounts" | "vendors";
  data: Payee[];
  isLoading: boolean;
  onEdit: (payee: Payee) => void;
  onDelete?: (ids: string[]) => Promise<void>;
  formatCurrency?: (amount: number, currency: string) => string;
  isAccountTable: boolean;
}

export const PayeeTable: React.FC<PayeeTableProps> = ({
  entityType,
  entityNamePlural,
  data,
  isLoading,
  onEdit,
  onDelete,
  formatCurrency,
  isAccountTable,
}) => {
  const { isDeleting } = usePayeeManagement(isAccountTable);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [payeeToDelete, setPayeeToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setPayeeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (payeeToDelete && onDelete) {
      await onDelete([payeeToDelete]);
      setPayeeToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading {entityNamePlural}...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8">No {entityNamePlural} found.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{entityType === "account" ? "Account Name" : "Vendor Name"}</TableHead>
            {isAccountTable && <TableHead>Currency</TableHead>}
            {isAccountTable && <TableHead className="text-right">Starting Balance</TableHead>}
            {isAccountTable && <TableHead>Remarks</TableHead>}
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((payee) => (
            <TableRow key={payee.id}>
              <TableCell>{payee.name}</TableCell>
              {isAccountTable && <TableCell>{payee.currency}</TableCell>}
              {isAccountTable && (
                <TableCell className="text-right">
                  {formatCurrency ? formatCurrency(payee.starting_balance || 0, payee.currency || "USD") : payee.starting_balance?.toFixed(2)}
                </TableCell>
              )}
              {isAccountTable && <TableCell>{payee.remarks}</TableCell>}
              <TableCell className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(payee)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(payee.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
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
              This action cannot be undone. This will permanently delete this{" "}
              {entityType} and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};