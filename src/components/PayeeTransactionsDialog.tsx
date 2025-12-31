import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PayeeTransactionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payeeName: string | null;
}

const PayeeTransactionsDialog: React.FC<PayeeTransactionsDialogProps> = ({ isOpen, onClose, payeeName }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Transactions for: {payeeName}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {/* Transaction list or details will go here */}
          <p>Displaying transactions related to {payeeName}.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayeeTransactionsDialog;