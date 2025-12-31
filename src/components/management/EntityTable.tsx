import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Edit, Trash2 } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

// --- Types ---

export interface ColumnDefinition<T> {
  key: keyof T | 'actions';
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface EntityTableProps<T extends { id: string }> {
  data: T[];
  isLoading: boolean;
  columns: ColumnDefinition<T>[];
  isDeletable?: (item: T) => boolean;
  handleEditClick: (item: T) => void;
  handleDeleteClick: (item: T) => void;
  onSelectAll: (selectedIds: string[]) => void;
  onRowSelect: (id: string, checked: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  sortConfig: { key: keyof T; direction: 'asc' | 'desc' } | null;
  setSortConfig: (config: { key: keyof T; direction: 'asc' | 'desc' } | null) => void;
}

// --- Component ---

export const EntityTable = <T extends { id: string }>({
  data,
  isLoading,
  columns,
  isDeletable = () => true,
  handleEditClick,
  handleDeleteClick,
  onSelectAll,
  onRowSelect,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  sortConfig,
  setSortConfig,
}: EntityTableProps<T>) => {
  
  const totalItems = data.length; // Note: This assumes data is already filtered/paginated by the parent, but we use it for pagination controls display.
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Simple client-side selection state management for demonstration
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Notify parent component about selected IDs
    onSelectAll(Array.from(selectedRows));
  }, [selectedRows, onSelectAll]);

  const handleHeaderCheckboxChange = (checked: boolean) => {
    if (checked) {
      const allIds = data.map(item => item.id);
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleRowCheckboxChange = (id: string, checked: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      onRowSelect(id, checked);
      return newSet;
    });
  };

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderCell = (row: T, column: ColumnDefinition<T>) => {
    if (column.key === 'actions') {
      return (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleEditClick(row)} title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          {isDeletable(row) && (
            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(row)} title="Delete">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      );
    }
    
    if (column.render) {
      return column.render(row);
    }
    
    const value = row[column.key as keyof T];
    return typeof value === 'string' || typeof value === 'number' ? value : String(value);
  };

  const renderTableContent = () => {
    if (isLoading) {
      return Array(itemsPerPage).fill(0).map((_, index) => (
        <TableRow key={index}>
          {columns.map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        </TableRow>
      ));
    }

    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
            No data found.
          </TableCell>
        </TableRow>
      );
    }

    return data.map((row) => (
      <TableRow key={row.id}>
        <TableCell className="w-12">
          <Checkbox
            checked={selectedRows.has(row.id)}
            onCheckedChange={(checked) => handleRowCheckboxChange(row.id, checked as boolean)}
          />
        </TableCell>
        {columns.map((column) => (
          <TableCell key={column.key as string}>
            {renderCell(row, column)}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.size === data.length && data.length > 0}
                  onCheckedChange={(checked) => handleHeaderCheckboxChange(checked as boolean)}
                  disabled={data.length === 0}
                />
              </TableHead>
              {columns.map((column) => (
                <TableHead key={column.key as string}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key as keyof T)}
                      className="p-0 h-auto"
                    >
                      {column.header}
                      <ArrowUpDown className={cn("ml-2 h-4 w-4", sortConfig?.key === column.key ? "opacity-100" : "opacity-50")} />
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          Rows per page:
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};