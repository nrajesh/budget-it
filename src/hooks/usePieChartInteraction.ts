"use client";

import { useState } from 'react';

export const usePieChartInteraction = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handlePieClick = (data: any, index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  return { activeIndex, handlePieClick };
};