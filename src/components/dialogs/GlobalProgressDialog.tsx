import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Loader2 } from "lucide-react";

export const GlobalProgressDialog = () => {
  const { operationProgress, setOperationProgress } = useTransactions();

  // If no progress state, or progress is null, don't render (or render closed)
  const isOpen = !!operationProgress;

  const handleOpenChange = (open: boolean) => {
    if (!open && operationProgress?.progress === 100) {
      setOperationProgress(null);
    }
  };

  const progressValue = operationProgress ? operationProgress.progress : 0;

  // Keep the dialog open until progress reaches 100%
  const shouldClose = progressValue >= 100;

  React.useEffect(() => {
    if (shouldClose && isOpen) {
      // Use a small timeout to ensure the progress bar reaches 100% before closing
      const timer = setTimeout(() => {
        setOperationProgress(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldClose, isOpen, setOperationProgress]);

  if (!operationProgress) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {operationProgress.title || "Processing..."}
          </DialogTitle>
          <DialogDescription>
            {operationProgress.description ||
              "Please wait while we process your request."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {operationProgress.stage || "Initializing..."}
            </p>
          </div>
          <Progress
            value={progressValue}
            className="w-full"
            indicatorClassName="bg-primary"
          />
          <p className="text-right text-sm text-muted-foreground">
            {Math.round(progressValue)}% Complete
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
