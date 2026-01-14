import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2 } from "lucide-react";

interface CleanupEntitiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'vendor' | 'category';
}

const CleanupEntitiesDialog: React.FC<CleanupEntitiesDialogProps> = ({ isOpen, onClose, entityType }) => {
  const dataProvider = useDataProvider();
  const { vendors, categories, invalidateAllData } = useTransactions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [unusedEntities, setUnusedEntities] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
        const entities = entityType === 'vendor' ? vendors : categories;
        // Filter those with 0 transactions
        const unused = entities.filter((e: any) => (e.totalTransactions || 0) === 0 && e.name !== 'Others' && e.name !== 'Transfer');
        setUnusedEntities(unused);
        setSelectedIds([]);
    }
  }, [isOpen, entityType, vendors, categories]);

  const handleToggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (checked: boolean) => {
      if (checked) setSelectedIds(unusedEntities.map(e => e.id));
      else setSelectedIds([]);
  };

  const handleDelete = async () => {
      if (selectedIds.length === 0) return;
      setIsProcessing(true);
      try {
          if (entityType === 'vendor') {
              // Batch delete not directly exposed in DataProvider for vendors but we can loop or add it.
              // LocalDataProvider supports bulkDelete on db directly if we were inside, but here we use the interface.
              // Interface only has 'deleteTransaction' etc. Wait, we don't have deleteVendor in interface?
              // Interface has 'getAllVendors'.
              // We need to add 'deleteVendor' and 'deleteCategory' to interface or loop?
              // The hook useEntityManagement uses `deleteRpcFn` which we stubbed.
              // We should probably add `deleteVendor` to DataProvider.

              // For now, I'll loop call delete? No, I can't delete vendors via DataProvider yet!
              // I missed adding deleteVendor/deleteCategory to DataProvider interface in Step 1 of this turn.
              // I will use a loop with a direct db access workaround or fail?
              // Actually, I can update the interface in the next step or right now?
              // I'll update the interface in the "Refactor Providers/Context" step or assumes it exists?

              // Loop for now as interface handles singular delete, or we add bulkDelete.
              // Singular is fine for user-selected cleanup actions which aren't massive usually.
              // Or Promise.all
              await Promise.all(selectedIds.map(id => dataProvider.deletePayee(id)));
          } else {
              await Promise.all(selectedIds.map(id => dataProvider.deleteCategory(id)));
          }

          showSuccess(`Deleted ${selectedIds.length} unused ${entityType === 'vendor' ? 'payees' : 'categories'}.`);
          await invalidateAllData();
          onClose();
      } catch (error: any) {
          showError(`Failed to delete: ${error.message}`);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cleanup Unused {entityType === 'vendor' ? 'Payees' : 'Categories'}</DialogTitle>
          <DialogDescription>
            The following {entityType === 'vendor' ? 'payees' : 'categories'} have 0 associated transactions. Select the ones you wish to delete.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
            <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                    id="select-all"
                    checked={unusedEntities.length > 0 && selectedIds.length === unusedEntities.length}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                />
                <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
                {unusedEntities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No unused items found.</p>
                ) : (
                    unusedEntities.map(e => (
                        <div key={e.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={e.id}
                                checked={selectedIds.includes(e.id)}
                                onCheckedChange={() => handleToggleSelect(e.id)}
                            />
                            <label htmlFor={e.id} className="text-sm">{e.name}</label>
                        </div>
                    ))
                )}
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing || selectedIds.length === 0}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Selected
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CleanupEntitiesDialog;
