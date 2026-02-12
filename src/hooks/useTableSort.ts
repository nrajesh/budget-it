import { useState, useMemo } from "react";

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

    return [...data].sort((a, b) => {
      const { key, direction } = sortConfig;

      // Handle nested properties if key is a string with dots (e.g., "category.name")
      const getValue = (item: T, path: string | keyof T) => {
        if (typeof path === "string" && path.includes(".")) {
          return path
            .split(".")
            .reduce((obj: unknown, k) => (obj ? (obj as Record<string, unknown>)[k] : null), item);
        }
        return item[path as keyof T];
      };

      const aValue = getValue(a, key);
      const bValue = getValue(b, key);

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if ((aValue as number) < (bValue as number)) {
        return direction === "asc" ? -1 : 1;
      }
      if ((aValue as number) > (bValue as number)) {
        return direction === "asc" ? 1 : -1;
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

  const handleHeaderRightClick = (e: React.MouseEvent) => {
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
