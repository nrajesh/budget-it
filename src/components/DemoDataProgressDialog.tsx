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

interface DemoDataProgressDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const DemoDataProgressDialog: React.FC<DemoDataProgressDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { demoDataProgress } = useTransactions();

  const progressValue = demoDataProgress ? (demoDataProgress.progress / demoDataProgress.totalStages) * 100 : 0;

  // Keep the dialog open until progress reaches 100%
  const shouldClose = progressValue >= 100;

  React.useEffect(() => {
    if (shouldClose) {
      // Use a small timeout to ensure the progress bar reaches 100% before closing
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldClose, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generating Demo Data</DialogTitle>
          <DialogDescription>
            Please wait while we set up your diverse demo data. This might take a moment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {demoDataProgress?.stage || "Initializing..."}
            </p>
          </div>
          <Progress value={progressValue} className="w-full" />
          <p className="text-right text-sm text-muted-foreground">
            {Math.round(progressValue)}% Complete
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};