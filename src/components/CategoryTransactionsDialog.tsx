import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CategoryTransactionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string | null;
}

const CategoryTransactionsDialog: React.FC<CategoryTransactionsDialogProps> = ({ isOpen, onClose, categoryName }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Transactions for: {categoryName}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {/* Transaction list or details will go here */}
          <p>Displaying transactions related to {categoryName}.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryTransactionsDialog;