"use client";

import React from "react";

export function usePieChartInteraction() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [selectedDrilldownItem, setSelectedDrilldownItem] = React.useState<string | null>(null);

  const handlePieClick = React.useCallback((data: any, index: number, nameKey: string) => {
    const clickedItemName = data[nameKey];

    if (activeIndex === index && selectedDrilldownItem === clickedItemName) {
      // If the same slice is clicked again, deselect it
      setActiveIndex(null);
      setSelectedDrilldownItem(null);
    } else {
      setActiveIndex(index);
      setSelectedDrilldownItem(clickedItemName);
    }
  }, [activeIndex, selectedDrilldownItem]);

  const resetDrilldown = React.useCallback(() => {
    setActiveIndex(null);
    setSelectedDrilldownItem(null);
  }, []);

  return {
    activeIndex,
    selectedDrilldownItem,
    handlePieClick,
    resetDrilldown,
  };
}