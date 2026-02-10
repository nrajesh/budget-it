
import React, { useRef, useState } from 'react';
import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortConfig } from "@/hooks/useTableSort";

interface SortableHeaderProps<T> extends React.ComponentProps<typeof TableHead> {
    label: string;
    sortKey: string | keyof T;
    sortConfig: SortConfig<T> | null;
    onSort: (key: string | keyof T) => void;
    onReset: (e: React.MouseEvent, key: string | keyof T) => void;
    className?: string;
    children?: React.ReactNode;
}

export function SortableHeader<T>({
    label,
    sortKey,
    sortConfig,
    onSort,
    onReset,
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
            onReset({ preventDefault: () => { } } as React.MouseEvent, sortKey);
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

    return (
        <TableHead
            className={cn(
                "cursor-pointer select-none transition-colors hover:bg-muted/50 active:bg-muted",
                isSorted && "bg-muted/30 text-foreground font-bold",
                className
            )}
            onClick={() => onSort(sortKey)}
            onContextMenu={(e) => onReset(e, sortKey)}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            title="Click to sort, Right-click (or long press) to reset"
            {...props}
        >
            <div className="flex items-center space-x-1">
                <span>{children || label}</span>
                {isSorted && (
                    <span className="ml-1 inline-flex">
                        {direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                        ) : (
                            <ArrowDown className="h-3 w-3" />
                        )}
                    </span>
                )}
            </div>
        </TableHead>
    );
}
