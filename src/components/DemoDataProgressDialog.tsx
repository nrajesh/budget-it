"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useTransactions } from "@/contexts/TransactionsContext"; // Import useTransactions

interface DemoDataProgressDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DemoDataProgressDialog: React.FC<DemoDataProgressDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { demoDataProgress } = useTransactions(); // Use demoDataProgress from context

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generating Demo Data</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-500">
            Please wait while we generate diverse demo data for your application.
            This might take a moment.
          </p>
          {demoDataProgress !== null && (
            <Progress value={demoDataProgress} className="w-full" />
          )}
          {demoDataProgress === 100 && (
            <p className="text-sm text-green-600">Demo data generation complete!</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};