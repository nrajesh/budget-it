"use client";

import React from "react";

export function usePieChartInteraction() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const handlePieClick = React.useCallback((index: number) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  }, []);

  const resetActiveIndex = React.useCallback(() => {
    setActiveIndex(null);
  }, []);

  return {
    activeIndex,
    handlePieClick,
    resetActiveIndex,
  };
}