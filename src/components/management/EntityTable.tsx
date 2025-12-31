import React from 'react';

export interface ColumnDefinition<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface EntityTableProps<T extends { id: string; name: string }> {
  data: T[];
  columns: ColumnDefinition<T>[];
  isLoading: boolean;
  handleEditClick: (item: T) => void;
  handleDeleteClick: (item: T) => void;
  isDeletable?: (item: T) => boolean;
  isEditable?: (item: T) => boolean;
  onRowSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selectedIds: string[]) => void;
}

export const EntityTable = <T extends { id: string; name: string }>(props: EntityTableProps<T>) => {
  if (props.isLoading) return <div>Loading...</div>;

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {props.columns.map((col, i) => (
              <th key={i} className="h-10 px-4 text-left font-medium">{col.header}</th>
            ))}
            <th className="h-10 px-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {props.data.map((item) => (
            <tr key={item.id} className="border-b">
              {props.columns.map((col, i) => (
                <td key={i} className="p-4">{col.accessor(item)}</td>
              ))}
              <td className="p-4 text-right">
                {(!props.isEditable || props.isEditable(item)) && (
                  <button onClick={() => props.handleEditClick(item)} className="mr-2">Edit</button>
                )}
                {(!props.isDeletable || props.isDeletable(item)) && (
                  <button onClick={() => props.handleDeleteClick(item)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};