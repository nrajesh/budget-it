import { useContinuitySync } from "@/hooks/useContinuitySync";
import { useEffect } from "react";
import LoadingSpinner from "./feedback/LoadingSpinner";

export const ContinuitySyncManager = () => {
  const { isSyncing, syncError } = useContinuitySync();

  // For debugging or global error signaling
  useEffect(() => {
    if (syncError) {
      console.error("Continuity Sync Error:", syncError);
    }
  }, [syncError]);

  if (isSyncing) {
    return (
      <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return null;
};
