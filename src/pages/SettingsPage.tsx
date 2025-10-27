"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/contexts/TransactionsContext';
import { DemoDataProgressDialog } from '@/components/DemoDataProgressDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SettingsPage = () => {
  const { generateDiverseDemoData, clearAllTransactions } = useTransactions();

  const handleGenerateDemoData = () => {
    generateDiverseDemoData();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Demo Data</CardTitle>
            <CardDescription>
              Populate the application with sample data to explore its features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This will add a variety of transactions, accounts, and categories to your workspace.
              You can clear this data at any time.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateDemoData}>Generate Demo Data</Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              These actions are irreversible. Please proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Clear All Data</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all transactions, accounts, categories, and budgets.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Clear All Data</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all of your data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearAllTransactions}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
      <DemoDataProgressDialog />
    </div>
  );
};

export default SettingsPage;