import React, { ReactNode } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import EntityTable from './EntityTable';
import { ColumnDefinition } from '@/types';

interface EntityManagementPageProps<T> {
  title: string;
  data: T[];
  columns: ColumnDefinition<T>[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddNew?: () => void;
  addNewButtonText?: string;
  children?: ReactNode;
}

const EntityManagementPage = <T extends { id: string }>({
  title,
  data,
  columns,
  isLoading,
  searchTerm,
  setSearchTerm,
  onAddNew,
  addNewButtonText = 'Add New',
  children
}: EntityManagementPageProps<T>) => {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {onAddNew && <Button onClick={onAddNew}>{addNewButtonText}</Button>}
      </div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      {children}
      <EntityTable data={data} columns={columns} isLoading={isLoading} />
    </div>
  );
};

export default EntityManagementPage;