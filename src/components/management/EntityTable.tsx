import * as React from "react";
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
import { Edit, Trash2, Loader2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

export interface ColumnDefinition<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  cellRenderer?: (item: T) => React.ReactNode;
  className?: string;
}

interface EntityTableProps<T extends { id: string; name: string }> {
  data: T[];
  columns: ColumnDefinition<T>[];
  isLoading: boolean;
  selectedRows: string[];
  handleRowSelect: (id: string, checked: boolean) => void;
  handleEditClick: (item: T) => void;
  handleDeleteClick: (item: T) => void;
  isEditing: (id: string) => boolean;
  isUpdating: boolean;
  isDeletable?: (item: T) => boolean;
  groupBy?: keyof T;
}

export const EntityTable = <T extends { id: string; name: string }>({
  data,
  columns,
  isLoading,
  selectedRows,
  handleRowSelect,
  handleEditClick,
  handleDeleteClick,
  isEditing,
  isUpdating,
  isDeletable = () => true,
  groupBy,
}: EntityTableProps<T>) => {
  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  data.length > 0 &&
                  selectedRows.length ===
                    data.filter((item) => isDeletable(item)).length
                }
                onCheckedChange={(checked) => {
                  const selectableIds = data
                    .filter((item) => isDeletable(item))
                    .map((item) => item.id);
                  if (selectableIds.length > 0) {
                    handleRowSelect(selectableIds.join(","), !!checked);
                  }
                }}
                aria-label="Select all"
              />
            </TableHead>
            {columns.map((col) => (
              <TableHead
                key={String(col.header)}
                className={`text-slate-800 dark:text-slate-200 font-semibold ${col.className || ""}`}
              >
                {col.header}
              </TableHead>
            ))}
            <TableHead className="text-right text-slate-800 dark:text-slate-200 font-semibold">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length + 2} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + 2}
                className="text-center py-4 text-muted-foreground"
              >
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => {
              const previousItem = data[index - 1];
              const isNewGroup =
                groupBy &&
                (!previousItem ||
                  String(item[groupBy]) !== String(previousItem[groupBy]));

              return (
                <React.Fragment key={item.id}>
                  {isNewGroup && (
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell
                        colSpan={columns.length + 2}
                        className="font-semibold py-2 text-slate-900 dark:text-slate-100"
                      >
                        {String(item[groupBy] || "Uncategorized")}
                      </TableCell>
                    </TableRow>
                  )}
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        data-state={
                          selectedRows.includes(item.id) && "selected"
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.includes(item.id)}
                            onCheckedChange={(checked) =>
                              handleRowSelect(item.id, Boolean(checked))
                            }
                            aria-label="Select row"
                            disabled={!isDeletable(item)}
                          />
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell
                            key={String(col.header)}
                            className={`text-slate-700 dark:text-slate-300 ${col.className || ""}`}
                          >
                            {col.cellRenderer
                              ? col.cellRenderer(item)
                              : typeof col.accessor === "function"
                                ? col.accessor(item)
                                : (item[
                                    col.accessor as keyof T
                                  ] as React.ReactNode) || "-"}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          {isUpdating && isEditing(item.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(item)}
                                disabled={!isDeletable(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(item)}
                                disabled={!isDeletable(item)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem
                        inset
                        onClick={() =>
                          handleRowSelect(
                            item.id,
                            !selectedRows.includes(item.id),
                          )
                        }
                      >
                        {selectedRows.includes(item.id) ? "Deselect" : "Select"}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        inset
                        onClick={() => handleEditClick(item)}
                        disabled={!isDeletable(item)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </ContextMenuItem>
                      <ContextMenuItem
                        inset
                        className="text-red-600"
                        onClick={() => handleDeleteClick(item)}
                        disabled={!isDeletable(item)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
