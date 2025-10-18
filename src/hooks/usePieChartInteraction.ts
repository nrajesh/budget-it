"use client";

import React from 'react';

export function usePieChartInteraction() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const handlePieClick = (index: number) => {
    setActiveIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const resetActiveIndex = () => {
    setActiveIndex(null);
  };

  return { activeIndex, handlePieClick, resetActiveIndex };
}