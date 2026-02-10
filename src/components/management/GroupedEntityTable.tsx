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
import {
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
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

interface GroupedEntityTableProps<T extends { id: string; name: string }> {
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
  groupBy: keyof T;
}

const ITEMS_PER_GROUP_PAGE = 5;

export const GroupedEntityTable = <T extends { id: string; name: string }>({
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
}: GroupedEntityTableProps<T>) => {
  const [expandedGroups, setExpandedGroups] = React.useState<
    Record<string, boolean>
  >({});
  const [groupPages, setGroupPages] = React.useState<Record<string, number>>(
    {},
  );

  // Group data by target key
  const groupedData = React.useMemo(() => {
    const groups: Record<string, T[]> = {};
    data.forEach((item) => {
      const groupValue = String(item[groupBy] || "Uncategorized");
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push(item);
    });
    return groups;
  }, [data, groupBy]);

  const groupKeys = React.useMemo(
    () => Object.keys(groupedData).sort(),
    [groupedData],
  );

  // Initialize expanded state for new groups
  React.useEffect(() => {
    setExpandedGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      groupKeys.forEach((key) => {
        if (next[key] === undefined) {
          next[key] = true; // Default to expanded
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [groupKeys]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const setPage = (groupKey: string, page: number) => {
    setGroupPages((prev) => ({
      ...prev,
      [groupKey]: page,
    }));
  };

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
          ) : groupKeys.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + 2}
                className="text-center py-4 text-muted-foreground"
              >
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            groupKeys.map((groupKey) => {
              const groupItems = groupedData[groupKey];
              const isExpanded = expandedGroups[groupKey];
              const currentPage = groupPages[groupKey] || 1;
              const totalPages = Math.ceil(
                groupItems.length / ITEMS_PER_GROUP_PAGE,
              );

              const startIndex = (currentPage - 1) * ITEMS_PER_GROUP_PAGE;
              const pagedItems = groupItems.slice(
                startIndex,
                startIndex + ITEMS_PER_GROUP_PAGE,
              );

              return (
                <React.Fragment key={groupKey}>
                  <TableRow
                    className="bg-muted/50 hover:bg-muted/70 cursor-pointer transition-colors"
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <TableCell
                      colSpan={columns.length + 2}
                      className="font-semibold py-2 text-slate-900 dark:text-slate-100"
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span>{groupKey}</span>
                        <span className="text-xs text-muted-foreground font-normal ml-2">
                          ({groupItems.length} accounts)
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <>
                      {pagedItems.map((item) => (
                        <ContextMenu key={item.id}>
                          <ContextMenuTrigger asChild>
                            <TableRow
                              data-state={
                                selectedRows.includes(item.id) && "selected"
                              }
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
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
                              <TableCell
                                className="text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
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
                              {selectedRows.includes(item.id)
                                ? "Deselect"
                                : "Select"}
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
                      ))}

                      {totalPages > 1 && (
                        <TableRow className="bg-background/50">
                          <TableCell
                            colSpan={columns.length + 2}
                            className="py-2"
                          >
                            <div className="flex items-center justify-center space-x-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPage(
                                    groupKey,
                                    Math.max(1, currentPage - 1),
                                  );
                                }}
                                disabled={currentPage === 1}
                                className="h-7 px-2"
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                Page {currentPage} of {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPage(
                                    groupKey,
                                    Math.min(totalPages, currentPage + 1),
                                  );
                                }}
                                disabled={currentPage === totalPages}
                                className="h-7 px-2"
                              >
                                Next{" "}
                                <ChevronRightIcon className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
