import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useLocation } from "react-router-dom";
import { getStepsForRoute } from "../constants/tourSteps";
import { type Step } from "react-joyride";
import { useTranslation } from "react-i18next";

interface TourContextType {
  isActive: boolean;
  startTour: () => void;
  stopTour: () => void;
  currentSteps: Step[];
  hasTourForCurrentRoute: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isActive, setIsActive] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const currentSteps = useMemo(() => {
    return getStepsForRoute(location.pathname, t);
  }, [location.pathname, t]);

  // Whenever the route changes, stop any running tour
  useEffect(() => {
    // Defer to avoid synchronous setState in effect during route change
    const timer = setTimeout(() => setIsActive(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const startTour = useCallback(() => {
    if (currentSteps.length > 0) {
      setIsActive(true);
    }
  }, [currentSteps]);

  const stopTour = useCallback(() => {
    setIsActive(false);
  }, []);

  const value = {
    isActive,
    startTour,
    stopTour,
    currentSteps,
    hasTourForCurrentRoute: currentSteps.length > 0,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};
