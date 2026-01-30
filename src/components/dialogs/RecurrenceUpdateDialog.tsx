
import React from "react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface RecurrenceUpdateDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (mode: 'single' | 'future') => void;
    actionType: 'edit' | 'delete';
    isMixedSelection?: boolean;
    count?: number;
}

export const RecurrenceUpdateDialog: React.FC<RecurrenceUpdateDialogProps> = ({
    isOpen,
    onOpenChange,
    onConfirm,
    actionType,
    isMixedSelection = false,
    count = 1
}) => {
    let title = "";
    let description = "";

    if (actionType === 'delete') {
        if (isMixedSelection) {
            title = "Delete Selected Transactions";
            description = `You have selected ${count} transactions. Some of them are part of a recurring series.
            
            Do you want to delete only the selected instances (Current Only) or also delete the future schedules for the recurring ones (Current & Future)?`;
        } else if (count > 1) {
            title = "Delete Recurring Transactions";
            description = `You have selected ${count} recurring transactions. Do you want to delete only these specific instances or also cancel their future schedules?`;
        } else {
            title = "Delete Recurring Transaction";
            description = "This transaction is part of a recurring series. Do you want to delete just this occurrence or this and all future occurrences?";
        }
    } else {
        // Edit mode (usually single)
        title = "Edit Recurring Transaction";
        description = "This transaction is part of a recurring series. Do you want to save changes to just this occurrence or update the future schedule as well?";
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="whitespace-pre-line">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
                    <Button
                        variant="outline"
                        onClick={() => {
                            onConfirm('single');
                            onOpenChange(false);
                        }}
                    >
                        {actionType === 'edit' ? "Current Only" : "Current Only"}
                    </Button>
                    <Button
                        variant={actionType === 'delete' ? "destructive" : "default"}
                        onClick={() => {
                            onConfirm('future');
                            onOpenChange(false);
                        }}
                    >
                        {actionType === 'edit' ? "Current & Future" : "Current & Future"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
