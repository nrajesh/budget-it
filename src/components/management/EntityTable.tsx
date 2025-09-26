import React, { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ColumnDefinition } from '@/types';

interface EntityTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  isLoading: boolean;
  onRowClick?: (item: T) => void;
}

const EntityTable = <T extends { id: string }>({ data, columns, isLoading, onRowClick }: EntityTableProps<T>) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  const getAccessorValue = (item: T, accessor: ColumnDefinition<T>['accessor']): ReactNode => {
    if (typeof accessor === 'function') {
      return accessor(item);
    }
    return item[accessor as keyof T] as ReactNode;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => <TableHead key={String(col.header)}>{col.header}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((item) => (
              <TableRow key={item.id} onClick={() => onRowClick?.(item)} className={onRowClick ? 'cursor-pointer' : ''}>
                {columns.map((col) => (
                  <TableCell key={String(col.header)}>
                    {col.render ? col.render(item) : getAccessorValue(item, col.accessor)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EntityTable;