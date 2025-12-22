import React from 'react';

export interface ColumnDefinition<T> {
  key: string;
  header: string;
  accessor?: (item: T) => string | number | React.ReactNode;
  cellRenderer?: (item: T) => React.ReactNode;
  className?: string;
}

export interface EntityTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  isLoading: boolean;
  selectedRows: string[];
  handleRowSelect: (id: string, checked: boolean) => void;
  handleEditClick: (item: T) => void;
  handleDeleteClick: (item: T) => void;
  isDeletable: (item: T) => boolean;
  isEditing: (id: string) => boolean;
  isUpdating: boolean;
}

export const EntityTable = <T extends { id: string }>({
  data,
  columns,
  isLoading,
  selectedRows,
  handleRowSelect,
  handleEditClick,
  handleDeleteClick,
  isDeletable,
  isEditing,
  isUpdating,
}: EntityTableProps<T>) => {
  // Table implementation
  return (
    <div className="overflow-x-auto">
      {/* Table content */}
    </div>
  );
};