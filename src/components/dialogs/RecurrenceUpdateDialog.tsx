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
import { useTranslation } from "react-i18next";

interface RecurrenceUpdateDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (mode: "single" | "future") => void;
  actionType: "edit" | "delete";
  isMixedSelection?: boolean;
  count?: number;
}

export const RecurrenceUpdateDialog: React.FC<RecurrenceUpdateDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  actionType,
  isMixedSelection = false,
  count = 1,
}) => {
  const { t } = useTranslation();
  let title: string;
  let description: string;

  if (actionType === "delete") {
    if (isMixedSelection) {
      title = t("dialogs.recurrence.titleDeleteSelected", {
        defaultValue: "Delete Selected Transactions",
      });
      description = t("dialogs.recurrence.descriptionDeleteSelected", {
        count,
        defaultValue:
          "You have selected {{count}} transactions. Some are part of a recurring series. Do you want to delete only selected instances (Current Only) or include future schedules for recurring ones (Current & Future)?",
      });
    } else if (count > 1) {
      title = t("dialogs.recurrence.titleDeleteMany", {
        defaultValue: "Delete Recurring Transactions",
      });
      description = t("dialogs.recurrence.descriptionDeleteMany", {
        count,
        defaultValue:
          "You have selected {{count}} recurring transactions. Do you want to delete only these specific instances or also cancel their future schedules?",
      });
    } else {
      title = t("dialogs.recurrence.titleDeleteOne", {
        defaultValue: "Delete Recurring Transaction",
      });
      description = t("dialogs.recurrence.descriptionDeleteOne", {
        defaultValue:
          "This transaction is part of a recurring series. Do you want to delete just this occurrence or this and all future occurrences?",
      });
    }
  } else {
    // Edit mode (usually single)
    title = t("dialogs.recurrence.titleEdit", {
      defaultValue: "Edit Recurring Transaction",
    });
    description = t("dialogs.recurrence.descriptionEdit", {
      defaultValue:
        "This transaction is part of a recurring series. Do you want to save changes to just this occurrence or update the future schedule as well?",
    });
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            {t("dialogs.common.cancel", { defaultValue: "Cancel" })}
          </AlertDialogCancel>
          <Button
            variant="outline"
            onClick={() => {
              onConfirm("single");
              onOpenChange(false);
            }}
          >
            {t("dialogs.recurrence.currentOnly", {
              defaultValue: "Current Only",
            })}
          </Button>
          <Button
            variant={actionType === "delete" ? "destructive" : "default"}
            onClick={() => {
              onConfirm("future");
              onOpenChange(false);
            }}
          >
            {t("dialogs.recurrence.currentAndFuture", {
              defaultValue: "Current & Future",
            })}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
