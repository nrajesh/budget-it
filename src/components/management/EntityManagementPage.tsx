import React, { useState } from 'react';
import { PlusCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, CustomColumnDef } from '@/components/DataTable'; // Corrected import
import { Payee } from '@/hooks/usePayeeManagement';
import { Category } from '@/hooks/useCategoryManagement'; // Import Category type
import { AddEditAccountDialog } from '@/components/AddEditAccountDialog';
import { AddEditVendorDialog } from '@/components/AddEditVendorDialog';
import { AddEditCategoryDialog } from '@/components/AddEditCategoryDialog'; // Import Category dialog

interface EntityManagementPageProps<TEntity extends { id: string }> {
  title: string;
  addPlaceholder: string;
  onAdd: (name: string, currency?: string, starting_balance?: number, remarks?: string) => Promise<void>;
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isImporting?: boolean;
  isLoading: boolean;
  data: TEntity[];
  columns: CustomColumnDef<TEntity>[]; // Use CustomColumnDef with generic type
  onDelete: (selectedIds: string[]) => Promise<void>;
  isAccountContext: boolean;
  isCategoryContext?: boolean; // New prop to distinguish categories
  selectedEntity: TEntity | null;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  handleEntityNameClick: (entity: TEntity) => void;
  onSave: (id: string, name: string, currency?: string, starting_balance?: number, remarks?: string) => Promise<void>;
}

export const EntityManagementPage = <TEntity extends { id: string }>({ // Make component generic
  title,
  addPlaceholder,
  onAdd,
  onFileChange,
  isImporting = false,
  isLoading,
  data,
  columns,
  onDelete,
  isAccountContext,
  isCategoryContext = false, // Default to false
  selectedEntity,
  isDialogOpen,
  setIsDialogOpen,
  handleEntityNameClick,
  onSave,
}: EntityManagementPageProps<TEntity>) => {
  const [newEntityName, setNewEntityName] = useState('');

  const handleAddEntity = async () => {
    if (newEntityName.trim()) {
      if (isAccountContext) {
        await onAdd(newEntityName.trim(), 'USD', 0, ''); // Default values for new account
      } else if (isCategoryContext) {
        await onAdd(newEntityName.trim()); // Categories only need name
      } else {
        await onAdd(newEntityName.trim()); // Vendors only need name
      }
      setNewEntityName('');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{title}</h1>

      <div className="flex items-center space-x-2">
        <Input
          placeholder={addPlaceholder}
          value={newEntityName}
          onChange={(e) => setNewEntityName(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddEntity}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add {isAccountContext ? 'Account' : (isCategoryContext ? 'Category' : 'Vendor')}
        </Button>
        {onFileChange && (
          <>
            <Input
              type="file"
              accept=".csv"
              onChange={onFileChange}
              className="hidden"
              id="entity-csv-upload"
            />
            <label htmlFor="entity-csv-upload">
              <Button asChild variant="outline" disabled={isImporting}>
                <span>
                  <Upload className="mr-2 h-4 w-4" /> Import CSV
                </span>
              </Button>
            </label>
            {isImporting && <p>Importing...</p>}
          </>
        )}
      </div>

      <DataTable
        data={data}
        isLoading={isLoading}
        columns={columns}
        onDelete={onDelete}
      />

      {isAccountContext ? (
        <AddEditAccountDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          selectedEntity={selectedEntity as Payee | null} // Cast to Payee
          onSave={onSave as (id: string, name: string, currency: string, starting_balance: number, remarks: string) => Promise<void>}
          onAdd={onAdd as (name: string, currency: string, starting_balance: number, remarks: string) => Promise<void>}
        />
      ) : isCategoryContext ? (
        <AddEditCategoryDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          selectedEntity={selectedEntity as Category | null} // Cast to Category
          onSave={onSave as (id: string, name: string) => Promise<void>}
          onAdd={onAdd as (name: string) => Promise<void>}
        />
      ) : (
        <AddEditVendorDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          selectedEntity={selectedEntity as Payee | null} // Cast to Payee
          onSave={onSave as (id: string, name: string) => Promise<void>}
          onAdd={onAdd as (name: string) => Promise<void>}
        />
      )}
    </div>
  );
};