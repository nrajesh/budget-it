import React from 'react';

export interface ColumnDefinition<T> {
  key: string;
  header: string;
  accessor: (item: T) => string | number | React.ReactNode;
  cellRenderer?: (item: T) => React.ReactNode;
  isSortable?: boolean;
}

interface EntityTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  isLoading: boolean;
  // ... other props
}

const EntityTable = <T extends { id: string }>({ data, columns, isLoading }: EntityTableProps<T>) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Table placeholder */}
      <p className="p-4">Table content for {data.length} items.</p>
    </div>
  );
};

export default EntityTable;