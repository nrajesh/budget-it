import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useTransactions } from "@/contexts/TransactionsContext";

interface DemoDataProgressDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const DemoDataProgressDialog: React.FC<DemoDataProgressDialogProps> = ({ isOpen, onOpenChange }) => {
  const { demoDataProgress } = useTransactions();

  const progressPercentage = demoDataProgress
    ? (demoDataProgress.progress / demoDataProgress.totalStages) * 100
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generating Demo Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p>{demoDataProgress?.stage || 'Initializing...'}</p>
          <Progress value={progressPercentage} />
          <p className="text-sm text-muted-foreground text-center">{Math.round(progressPercentage)}%</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoDataProgressDialog;