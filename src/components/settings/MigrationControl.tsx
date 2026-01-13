import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDataProvider } from "@/context/DataProviderContext";
import { showSuccess, showError } from "@/utils/toast";
import { Download, Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const MigrationControl = () => {
  const dataProvider = useDataProvider();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      if (!dataProvider.exportData) {
        showError("Export not supported by current provider.");
        return;
      }
      const data = await dataProvider.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("Data exported successfully!");
    } catch (error: any) {
      showError(`Export failed: ${error.message}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!dataProvider.importData) {
        showError("Import not supported by current provider.");
        return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const data = JSON.parse(json);
        await dataProvider.importData(data);
        showSuccess("Data imported successfully! Please refresh the page.");
        // Optional: window.location.reload();
      } catch (error: any) {
        showError(`Import failed: ${error.message}`);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="mt-6 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           Local Data Management
        </CardTitle>
        <CardDescription>
          Backup your data to a JSON file or restore from a backup.
          Your data is stored locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Since this is a local-first app, if you clear your browser data, you will lose your records.
            Please export regular backups.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export Backup
          </Button>

          <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
            />
            <Button onClick={handleImportClick} variant="outline" className="w-full sm:w-auto" disabled={isImporting}>
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Restore Backup"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
