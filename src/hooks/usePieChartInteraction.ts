"use client";

import { useState, useCallback } from 'react';

export const usePieChartInteraction = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieClick = useCallback((data: any, index: number) => {
    setActiveIndex(prevIndex => (prevIndex === index ? null : index));
  }, []);

  const resetActiveIndex = useCallback(() => {
    setActiveIndex(null);
  }, []);

  return { activeIndex, onPieClick, resetActiveIndex };
};