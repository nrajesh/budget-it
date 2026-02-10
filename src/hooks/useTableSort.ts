import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
    key: keyof T | string; // Allow string for nested keys or custom accessors
    direction: SortDirection;
}

interface UseTableSortProps<T> {
    data: T[];
    initialSort?: SortConfig<T>;
}

export function useTableSort<T>({ data, initialSort }: UseTableSortProps<T>) {
    const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(initialSort || null);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;

        return [...data].sort((a, b) => {
            const { key, direction } = sortConfig;

            // Handle nested properties if key is a string with dots (e.g., "category.name")
            const getValue = (item: T, path: string | keyof T) => {
                if (typeof path === 'string' && path.includes('.')) {
                    return path.split('.').reduce((obj: any, k) => (obj ? obj[k] : null), item);
                }
                return item[path as keyof T];
            };

            const aValue = getValue(a, key);
            const bValue = getValue(b, key);

            if (aValue < bValue) {
                return direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortConfig]);

    const handleHeaderClick = (key: keyof T | string) => {
        setSortConfig((currentSort) => {
            if (currentSort && currentSort.key === key) {
                if (currentSort.direction === 'asc') {
                    return { key, direction: 'desc' };
                }
                // Third click could reset, but user asked for toggle on click and right-click to reset.
                // Usually: Asc -> Desc -> Asc. 
                // Let's stick to Asc -> Desc -> Asc.
                return { key, direction: 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const handleHeaderRightClick = (e: React.MouseEvent, key: keyof T | string) => {
        e.preventDefault(); // Prevent default context menu
        setSortConfig(null);
    };

    // Long press for touch devices
    const handleHeaderLongPress = (key: keyof T | string) => {
        setSortConfig(null);
    };

    return {
        sortedData,
        sortConfig,
        handleHeaderClick,
        handleHeaderRightClick,
        handleHeaderLongPress
    };
}
