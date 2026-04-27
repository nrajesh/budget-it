import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload, RefreshCw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface TransactionPageHeaderProps {
  onImportClick: () => void;
  onExportClick: () => void;
  onDetectTransfers: () => void;
  onAddTransaction: () => void;
  onCleanUpDuplicates: () => void;
  onBulkCategorize?: () => void;
  isBulkCategorizeEnabled?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TransactionPageHeader: React.FC<TransactionPageHeaderProps> = ({
  onImportClick,
  onExportClick,
  onDetectTransfers,
  onAddTransaction,
  onCleanUpDuplicates,
  onBulkCategorize,
  isBulkCategorizeEnabled,
  fileInputRef,
  onFileChange,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-4">
      <div>
        <h1 className="app-gradient-title app-page-title">
          {t("transactions.header.title", { defaultValue: "Transactions" })}
        </h1>
        <p className="app-page-subtitle">
          {t("transactions.header.subtitle", {
            defaultValue: "Manage and track your financial activities",
          })}
        </p>
      </div>
      <div className="app-action-panel">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Input
            type="file"
            ref={fileInputRef as React.Ref<HTMLInputElement>}
            onChange={onFileChange}
            accept=".csv"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={onDetectTransfers}
            className="justify-center sm:flex-none"
            title={t("transactions.header.detectTransfers", {
              defaultValue: "Detect Transfers",
            })}
            aria-label={t("transactions.header.detectTransfers", {
              defaultValue: "Detect Transfers",
            })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="text-sm">
              {t("transactions.header.detectTransfers", {
                defaultValue: "Detect Transfers",
              })}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={onCleanUpDuplicates}
            className="justify-center text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 sm:flex-none dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
            title={t("transactions.header.cleanupDuplicates", {
              defaultValue: "Cleanup Duplicates",
            })}
            aria-label={t("transactions.header.cleanupDuplicates", {
              defaultValue: "Cleanup Duplicates",
            })}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            <span className="text-sm">
              {t("transactions.header.cleanupDuplicates", {
                defaultValue: "Cleanup Duplicates",
              })}
            </span>
          </Button>
          {onBulkCategorize && (
            <Button
              variant="outline"
              onClick={onBulkCategorize}
              disabled={!isBulkCategorizeEnabled}
              className="tour-bulk-categorize col-span-2 justify-center text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200 sm:col-span-1 sm:flex-none dark:bg-purple-950/20 dark:hover:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800"
              title={t("transactions.header.categorizeMissing", {
                defaultValue: "Categorize Missing",
              })}
              aria-label={t("transactions.header.categorizeMissing", {
                defaultValue: "Categorize Missing",
              })}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="text-sm">
                {t("transactions.header.categorizeMissing", {
                  defaultValue: "Categorize Missing",
                })}
              </span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onImportClick}
            className="justify-center border-slate-300 hover:border-slate-400 hover:bg-slate-100 sm:flex-none dark:border-slate-700 dark:hover:border-sky-500/70 dark:hover:bg-sky-950/40 dark:hover:text-sky-100"
            title={t("transactions.header.importCsv", {
              defaultValue: "Import CSV",
            })}
            aria-label={t("transactions.header.importCsv", {
              defaultValue: "Import CSV",
            })}
          >
            <Upload className="mr-2 h-4 w-4" />
            <span className="text-sm">
              {t("transactions.header.importCsv", {
                defaultValue: "Import CSV",
              })}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={onExportClick}
            className="tour-export-transactions justify-center sm:flex-none"
            title={t("transactions.header.exportCsv", {
              defaultValue: "Export CSV",
            })}
            aria-label={t("transactions.header.exportCsv", {
              defaultValue: "Export CSV",
            })}
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="text-sm">
              {t("transactions.header.exportCsv", {
                defaultValue: "Export CSV",
              })}
            </span>
          </Button>
          <Button
            onClick={onAddTransaction}
            className="col-span-2 justify-center bg-indigo-600 hover:bg-indigo-700 text-white sm:col-span-1 sm:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("transactions.header.addTransaction", {
              defaultValue: "Add Transaction",
            })}
          </Button>
        </div>
      </div>
    </div>
  );
};
