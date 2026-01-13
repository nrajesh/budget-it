import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VendorReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const VendorReconciliationDialog: React.FC<VendorReconciliationDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vendor Reconciliation</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            Reconciliation features are currently unavailable in local-only mode.
            This feature will be re-enabled in a future update.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendorReconciliationDialog;
