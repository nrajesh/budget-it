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
import { Category } from '@/hooks/useCategoryManagement';

interface AddEditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEntity: Category | null;
  onSave: (id: string, name: string) => Promise<void>;
  onAdd: (name: string) => Promise<void>;
}

export const AddEditCategoryDialog: React.FC<AddEditCategoryDialogProps> = ({
  open,
  onOpenChange,
  selectedEntity,
  onSave,
  onAdd,
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (selectedEntity) {
      setName(selectedEntity.name);
    } else {
      setName('');
    }
  }, [selectedEntity, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      // Optionally show a toast error
      return;
    }

    if (selectedEntity) {
      await onSave(selectedEntity.id, name);
    } else {
      await onAdd(name);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{selectedEntity ? 'Edit Category' : 'Add Category'}</DialogTitle>
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
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            {selectedEntity ? 'Save changes' : 'Add Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};