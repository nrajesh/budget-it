import { useState, useMemo, type MouseEvent } from "react";

export type SortDirection = "asc" | "desc";

export interface SortConfig<T> {
  key: keyof T | string; // Allow string for nested keys or custom accessors
  direction: SortDirection;
}

interface UseTableSortProps<T> {
  data: T[];
  initialSort?: SortConfig<T>;
}

export function useTableSort<T>({ data, initialSort }: UseTableSortProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    initialSort || null,
  );

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const { key, direction } = sortConfig;
    const isAsc = direction === "asc";

    // Optimization: Determine the value accessor once, outside the loop.
    // This avoids repeated string splitting and type checking for every comparison.
    let getValue: (item: T) => unknown;

    if (typeof key === "string" && key.includes(".")) {
      const pathParts = key.split(".");
      getValue = (item: T) => {
        return pathParts.reduce(
          (obj: unknown, part) =>
            obj ? (obj as Record<string, unknown>)[part] : null,
          item,
        );
      };
    } else {
      // Direct access is much faster than reduce
      getValue = (item: T) => item[key as keyof T];
    }

    return [...data].sort((a, b) => {
      const aValue = getValue(a);
      const bValue = getValue(b);

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return isAsc
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Ensure we are comparing numbers safely
      const aNum = aValue as number;
      const bNum = bValue as number;

      if (aNum < bNum) {
        return isAsc ? -1 : 1;
      }
      if (aNum > bNum) {
        return isAsc ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleHeaderClick = (key: keyof T | string) => {
    setSortConfig((currentSort) => {
      if (currentSort && currentSort.key === key) {
        if (currentSort.direction === "asc") {
          return { key, direction: "desc" };
        }
        // Third click could reset, but user asked for toggle on click and right-click to reset.
        // Usually: Asc -> Desc -> Asc.
        // Let's stick to Asc -> Desc -> Asc.
        return { key, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleHeaderRightClick = (e: MouseEvent) => {
    e.preventDefault(); // Prevent default context menu
    setSortConfig(null);
  };

  // Long press for touch devices
  const handleHeaderLongPress = () => {
    setSortConfig(null);
  };

  return {
    sortedData,
    sortConfig,
    handleHeaderClick,
    handleHeaderRightClick,
    handleHeaderLongPress,
  };
}
