"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useTransactions } from '@/contexts/TransactionsContext';

export const DemoDataProgressDialog = () => {
  const { demoDataProgress } = useTransactions();

  const isOpen = demoDataProgress !== null;

  const progressValue = demoDataProgress 
    ? (demoDataProgress.progress / demoDataProgress.totalStages) * 100 
    : 0;

  return (
    <Dialog open={isOpen}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Generating Demo Data</DialogTitle>
          <DialogDescription>
            Please wait while we populate your account with sample data. This may take a moment.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Progress value={progressValue} className="w-full" />
          <div className="text-center mt-2">
            <p className="text-sm text-muted-foreground">
              {demoDataProgress?.stage || "Initializing..."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};