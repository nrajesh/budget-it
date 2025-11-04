import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, Trash2, Edit } from 'lucide-react';
import { EntityTable, ColumnDefinition } from './EntityTable';

interface ManagementPageProps<T extends { id: string }> {
  title: string;
  description: string;
  columns: ColumnDefinition<T>[];
  data: T[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (ids: string[]) => void;
  onImport: (file: File) => void;
}

export function ManagementPage<T extends { id: string }>({
  title,
  description,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  onImport,
}: ManagementPageProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDelete = () => {
    if (selectedIds.length > 0) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };
  
  const actionColumn: ColumnDefinition<T> = {
    id: 'actions',
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
        <Edit className="h-4 w-4" />
      </Button>
    ),
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </header>

      <div className="flex items-center justify-between mb-4">
        <div>
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
          <Button variant="outline" className="ml-2" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".csv"
          />
        </div>
        {selectedIds.length > 0 && (
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.length})
          </Button>
        )}
      </div>

      <EntityTable
        columns={[...columns, actionColumn]}
        data={data}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}