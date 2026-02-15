import React, { useRef } from "react";
import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortConfig } from "@/hooks/useTableSort";

interface SortableHeaderProps<T> extends React.ComponentProps<
  typeof TableHead
> {
  label: string;
  sortKey: string | keyof T;
  sortConfig: SortConfig<T> | null;
  onSort: (key: string | keyof T) => void;
  onSortReset: (e: React.MouseEvent, key: string | keyof T) => void;
  className?: string;
  children?: React.ReactNode;
}

export function SortableHeader<T>({
  label,
  sortKey,
  sortConfig,
  onSort,
  onSortReset,
  className,
  children,
  ...props
}: SortableHeaderProps<T>) {
  const isSorted = sortConfig?.key === sortKey;
  const direction = isSorted ? sortConfig.direction : null;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      // Mock event for reset
      onSortReset({ preventDefault: () => {} } as React.MouseEvent, sortKey);
    }, 500); // 500ms for long press
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchStart = () => {
    handleMouseDown();
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Heuristic to fix flex alignment based on text alignment classes
  const alignmentClass = className?.includes("text-right")
    ? "justify-end"
    : className?.includes("text-center")
      ? "justify-center"
      : "justify-start";

  return (
    <TableHead
      className={cn(
        "p-0", // Remove default padding so button fills cell
        isSorted && "bg-muted/30 text-foreground font-bold",
        className,
      )}
      aria-sort={
        isSorted ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
      {...props}
    >
      <button
        type="button"
        className={cn(
          "flex h-full w-full items-center gap-1 px-4 py-2",
          "cursor-pointer select-none transition-colors hover:bg-muted/50 active:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          "text-inherit font-inherit bg-transparent border-0", // Reset native button styles
          alignmentClass,
        )}
        onClick={() => onSort(sortKey)}
        onContextMenu={(e) => onSortReset(e, sortKey)}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        title="Click to sort, Right-click (or long press) to reset"
      >
        <span>{children || label}</span>
        {isSorted && (
          <span className="inline-flex">
            {direction === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
          </span>
        )}
      </button>
    </TableHead>
  );
}
