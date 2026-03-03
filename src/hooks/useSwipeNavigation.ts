"use client";

import { useEffect, useCallback, useRef } from "react";

interface UseSwipeNavigationOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  minSwipeDistance?: number;
  enabled?: boolean;
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  enabled = true,
}: UseSwipeNavigationOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    },
    [enabled],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (
        !enabled ||
        touchStartX.current === null ||
        touchStartY.current === null
      )
        return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      // Only trigger if horizontal swipe is dominant
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) >= minSwipeDistance
      ) {
        if (deltaX > 0) {
          onSwipeRight(); // Swipe right = go back (previous period)
        } else {
          onSwipeLeft(); // Swipe left = go forward (next period)
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [enabled, minSwipeDistance, onSwipeLeft, onSwipeRight],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      // Only handle if not typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSwipeRight(); // Left arrow = previous period
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onSwipeLeft(); // Right arrow = next period
      }
    },
    [enabled, onSwipeLeft, onSwipeRight],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleTouchStart, handleTouchEnd, handleKeyDown, enabled]);

  return { containerRef };
}
