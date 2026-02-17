import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useTableSort } from "@/hooks/useTableSort";

describe("useTableSort", () => {
  it("should return the original data if no sort is applied", () => {
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const { result } = renderHook(() => useTableSort({ data }));

    expect(result.current.sortedData).toEqual(data);
    expect(result.current.sortConfig).toBeNull();
  });

  it("should sort data by a simple key in ascending order", () => {
    const data = [{ val: 3 }, { val: 1 }, { val: 2 }];
    const { result } = renderHook(() =>
      useTableSort({
        data,
        initialSort: { key: "val", direction: "asc" },
      }),
    );

    expect(result.current.sortedData).toEqual([
      { val: 1 },
      { val: 2 },
      { val: 3 },
    ]);
  });

  it("should sort data by a simple key in descending order", () => {
    const data = [{ val: 3 }, { val: 1 }, { val: 2 }];
    const { result } = renderHook(() =>
      useTableSort({
        data,
        initialSort: { key: "val", direction: "desc" },
      }),
    );

    expect(result.current.sortedData).toEqual([
      { val: 3 },
      { val: 2 },
      { val: 1 },
    ]);
  });

  it("should sort data by a nested key", () => {
    const data = [
      { user: { name: "Charlie" } },
      { user: { name: "Alice" } },
      { user: { name: "Bob" } },
    ];
    const { result } = renderHook(() =>
      useTableSort({
        data,
        initialSort: { key: "user.name", direction: "asc" },
      }),
    );

    expect(result.current.sortedData).toEqual([
      { user: { name: "Alice" } },
      { user: { name: "Bob" } },
      { user: { name: "Charlie" } },
    ]);
  });

  it("should handle null and undefined values", () => {
    const data = [
      { val: 2 },
      { val: null },
      { val: 1 },
      { val: undefined },
    ];
    // Sort logic places null/undefined at the end for asc? Let's check existing implementation.
    // implementation: if (aValue === null || aValue === undefined) return 1;
    // so null/undefined are pushed to the end.

    const { result } = renderHook(() =>
      useTableSort({
        data,
        initialSort: { key: "val", direction: "asc" },
      }),
    );

    expect(result.current.sortedData).toEqual([
      { val: 1 },
      { val: 2 },
      { val: null },
      { val: undefined },
    ]);
  });

  it("should toggle sort direction on header click", () => {
    const data = [{ val: 1 }, { val: 2 }];
    const { result } = renderHook(() =>
      useTableSort({
        data,
        initialSort: { key: "val", direction: "asc" },
      }),
    );

    expect(result.current.sortConfig).toEqual({ key: "val", direction: "asc" });

    act(() => {
      result.current.handleHeaderClick("val");
    });

    expect(result.current.sortConfig).toEqual({ key: "val", direction: "desc" });

    act(() => {
      result.current.handleHeaderClick("val");
    });

    expect(result.current.sortConfig).toEqual({ key: "val", direction: "asc" });
  });

  it("should switch sort key on different header click", () => {
    const data = [{ val: 1, other: 2 }];
    const { result } = renderHook(() =>
      useTableSort({
        data,
        initialSort: { key: "val", direction: "asc" },
      }),
    );

    act(() => {
      result.current.handleHeaderClick("other");
    });

    expect(result.current.sortConfig).toEqual({ key: "other", direction: "asc" });
  });

  it("should handle mixed string and number sorting", () => {
     // Existing implementation coerces comparison.
     const data = [{ val: "10" }, { val: "2" }];
     // "10" vs "2" -> "10".localeCompare("2") -> -1 (because '1' < '2')
     // wait, localeCompare handles numeric? No, strictly string.
     // So "10" comes before "2" in string sort.

     const { result } = renderHook(() =>
       useTableSort({
         data,
         initialSort: { key: "val", direction: "asc" },
       }),
     );

     expect(result.current.sortedData).toEqual([{ val: "10" }, { val: "2" }]);
  });
});
