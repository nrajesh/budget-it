import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Payee } from '@/hooks/usePayeeManagement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddEditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEntity: Payee | null;
  onSave: (id: string, name: string, currency: string, starting_balance: number, remarks: string) => Promise<void>;
  onAdd: (name: string, currency: string, starting_balance: number, remarks: string) => Promise<void>;
}

export const AddEditAccountDialog: React.FC<AddEditAccountDialogProps> = ({
  open,
  onOpenChange,
  selectedEntity,
  onSave,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [startingBalance, setStartingBalance] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (selectedEntity) {
      setName(selectedEntity.name);
      setCurrency(selectedEntity.currency || 'USD');
      setStartingBalance(selectedEntity.starting_balance || 0);
      setRemarks(selectedEntity.remarks || '');
    } else {
      setName('');
      setCurrency('USD');
      setStartingBalance(0);
      setRemarks('');
    }
  }, [selectedEntity, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      // Optionally show a toast error
      return;
    }

    if (selectedEntity) {
      await onSave(selectedEntity.id, name, currency, startingBalance, remarks);
    } else {
      await onAdd(name, currency, startingBalance, remarks);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{selectedEntity ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currency" className="text-right">
              Currency
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="CHF">CHF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startingBalance" className="text-right">
              Starting Balance
            </Label>
            <Input
              id="startingBalance"
              type="number"
              value={startingBalance}
              onChange={(e) => setStartingBalance(parseFloat(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="remarks" className="text-right">
              Remarks
            </Label>
            <Input
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            {selectedEntity ? 'Save changes' : 'Add Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};