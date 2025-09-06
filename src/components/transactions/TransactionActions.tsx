import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Download, RotateCcw, Trash2 } from "lucide-react";

interface TransactionActionsProps {
  numSelected: number;
  isImporting: boolean;
  isRefreshing: boolean;
  onImportClick: () => void;
  onExportClick: () => void;
  onRefresh: () => void;
  onBulkDeleteClick: () => void;
}

export const TransactionActions: React.FC<TransactionActionsProps> = ({
  numSelected,
  isImporting,
  isRefreshing,
  onImportClick,
  onExportClick,
  onRefresh,
  onBulkDeleteClick,
}) => {
  return (
    <div className="flex items-center space-x-2">
      {numSelected > 0 && (
        <Button variant="destructive" onClick={onBulkDeleteClick}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected ({numSelected})
        </Button>
      )}
      <Button onClick={onImportClick} variant="outline" disabled={isImporting}>
        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Import CSV
      </Button>
      <Button onClick={onExportClick} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4" />
        )}
        <span className="sr-only">Refresh Transactions</span>
      </Button>
    </div>
  );
};