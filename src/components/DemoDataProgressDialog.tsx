import React from 'react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const DemoDataProgressDialog: React.FC = () => {
  const { demoDataProgress, clearAllTransactions, invalidateAllData } = useTransactions();

  const isOpen = demoDataProgress !== null;
  
  const progressValue = demoDataProgress ? (demoDataProgress.progress / demoDataProgress.totalStages) * 100 : 0;
  const isComplete = demoDataProgress && demoDataProgress.progress >= demoDataProgress.totalStages;

  const handleClose = () => {
    // If complete, invalidate data to refresh UI
    if (isComplete) {
      invalidateAllData();
    }
    // Note: In a real implementation, we would need a way to set demoDataProgress back to null, 
    // likely via a state setter passed from the provider or a dedicated function.
    // Since we are using a placeholder context, we'll rely on the context logic to handle state reset.
    console.log("Demo data generation finished or cancelled.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isComplete ? "Demo Data Complete" : "Generating Demo Data..."}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!isComplete && (
            <>
              <Progress value={progressValue} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {demoDataProgress?.stage || "Initializing..."}
              </p>
              <p className="text-xs text-gray-500">
                Stage {demoDataProgress?.progress} of {demoDataProgress?.totalStages}
              </p>
            </>
          )}
          {isComplete && (
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-green-600">Success!</p>
              <p className="text-sm text-muted-foreground">Your application is now populated with diverse financial data.</p>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleClose}>
            {isComplete ? "Start Using App" : "Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoDataProgressDialog;