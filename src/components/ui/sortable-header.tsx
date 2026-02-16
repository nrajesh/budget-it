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

  const isRightAligned = className?.includes("text-right");

  return (
    <TableHead
      className={cn(
        // Reset default padding to allow button to fill the cell
        // Also remove hover effect from the cell itself since the button handles it
        "p-0 hover:bg-transparent",
        className,
      )}
      aria-sort={
        isSorted ? (direction === "asc" ? "ascending" : "descending") : undefined
      }
      {...props}
    >
      <button
        className={cn(
          "flex h-full w-full items-center gap-1 px-4",
          "ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "hover:bg-muted/50 active:bg-muted",
          "font-inherit text-inherit", // Ensure font/color inheritance
          isSorted && "bg-muted/30 font-bold text-foreground",
          isRightAligned ? "justify-end" : "justify-start",
        )}
        onClick={() => onSort(sortKey)}
        onContextMenu={(e) => onSortReset(e, sortKey)}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        type="button"
        title="Click to sort, Right-click (or long press) to reset"
      >
        <span>{children || label}</span>
        {isSorted && (
          <span className="ml-1 flex-shrink-0">
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
