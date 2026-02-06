import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload, RefreshCw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TransactionPageHeaderProps {
    onImportClick: () => void;
    onExportClick: () => void;
    onDetectTransfers: () => void;
    onAddTransaction: () => void;
    onCleanUpDuplicates: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TransactionPageHeader: React.FC<TransactionPageHeaderProps> = ({
    onImportClick,
    onExportClick,
    onDetectTransfers,
    onAddTransaction,
    onCleanUpDuplicates,
    fileInputRef,
    onFileChange,
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                    Transactions
                </h1>
                <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">Manage & track your financial activities</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept=".csv"
                    className="hidden"
                />
                <Button variant="outline" onClick={onImportClick} className="flex-1 sm:flex-none">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
                <Button variant="outline" onClick={onExportClick} className="flex-1 sm:flex-none">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
                <Button variant="outline" onClick={onDetectTransfers} className="flex-1 sm:flex-none">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Detect Transfers
                </Button>
                <Button variant="outline" onClick={onCleanUpDuplicates} className="flex-1 sm:flex-none text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Cleanup Duplicates
                </Button>
                <Button onClick={onAddTransaction} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                </Button>
            </div>
        </div>
    );
};
