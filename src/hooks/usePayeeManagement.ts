import * as React from "react";
import { useEntityManagement } from "./useEntityManagement";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Payee } from "@/components/dialogs/AddEditPayeeDialog";
import Papa from "papaparse";
import { showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { saveFile } from "@/utils/backupUtils";

import { useLedger } from "@/contexts/LedgerContext";
import { slugify } from "@/lib/utils";
import { sanitizeCSVField } from "@/utils/csvUtils";

export const usePayeeManagement = (isAccount: boolean) => {
  const { invalidateAllData, deleteEntity } = useTransactions();
  const { activeLedger } = useLedger();
  const navigate = useNavigate();

  const entityName = isAccount ? "Account" : "Vendor";
  const entityNamePlural = isAccount ? "accounts" : "vendors";

  const managementProps = useEntityManagement<Payee>({
    entityName,
    entityNamePlural,
    queryKey: [entityNamePlural],
    deleteRpcFn: "delete_payees_batch",
    batchUpsertRpcFn: isAccount
      ? "batch_upsert_accounts"
      : "batch_upsert_vendors",
    batchUpsertPayloadKey: isAccount ? "p_accounts" : "p_names",
    isDeletable: (item) => item.name !== "Others",
    onSuccess: invalidateAllData,
    customDeleteHandler: (ids) =>
      deleteEntity(isAccount ? "account" : "vendor", ids),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    managementProps.batchUpsertMutation.reset(); // Reset mutation state
    const { setIsImporting } = managementProps;
    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredHeaders = isAccount
          ? ["Account Name", "Currency", "Starting Balance", "Remarks"]
          : ["Vendor Name"];
        const hasAllHeaders = requiredHeaders.every((h) =>
          results.meta.fields?.includes(h),
        );

        if (!hasAllHeaders) {
          showError(
            `CSV is missing required headers: ${requiredHeaders.join(", ")}`,
          );
          setIsImporting(false);
          return;
        }

        const parsedData = results.data as Record<string, string | undefined>[];
        const dataToUpsert = parsedData
          .map((row) =>
            isAccount
              ? {
                  name: row["Account Name"],
                  currency: row["Currency"],
                  starting_balance:
                    parseFloat(row["Starting Balance"] || "0") || 0,
                  remarks: row["Remarks"],
                }
              : { name: row["Vendor Name"] },
          )
          .filter((item) => item.name);

        if (dataToUpsert.length === 0) {
          showError(
            `No valid ${entityName.toLowerCase()} data found in the CSV file.`,
          );
          setIsImporting(false);
          return;
        }
        managementProps.batchUpsertMutation.mutate(dataToUpsert);
      },
      error: (error: unknown) => {
        showError(`CSV parsing error: ${(error as Error).message}`);
        setIsImporting(false);
      },
    });
  };

  const handleExportClick = (payees: Payee[]) => {
    if (payees.length === 0) {
      showError(`No ${entityNamePlural} to export.`);
      return;
    }

    let csvContent = "";
    if (isAccount) {
      const headers = [
        "Account Name",
        "Currency",
        "Starting Balance",
        "Remarks",
      ];
      csvContent = [
        headers.join(","),
        ...payees.map((p) =>
          [
            `"${sanitizeCSVField(p.name).replace(/"/g, '""')}"`,
            p.currency || "USD",
            p.starting_balance || 0,
            `"${sanitizeCSVField(p.remarks || "").replace(/"/g, '""')}"`,
          ].join(","),
        ),
      ].join("\n");
    } else {
      const headers = ["Vendor Name"];
      csvContent = [
        headers.join(","),
        ...payees.map((p) => [`"${sanitizeCSVField(p.name).replace(/"/g, '""')}"`].join(",")),
      ].join("\n");
    }

    // Add BOM for Excel compatibility
    const BOM = "\uFEFF";
    const csvString = BOM + csvContent;
    const fileName = activeLedger
      ? `${slugify(activeLedger.name)}_${entityNamePlural}_export.csv`
      : `${entityNamePlural}_export.csv`;

    saveFile(fileName, csvString, `${entityName} Export`);
  };

  const handlePayeeNameClick = (payeeName: string) => {
    const filterKey = isAccount ? "filterAccount" : "filterVendor";
    navigate("/transactions", { state: { [filterKey]: payeeName } });
  };

  return {
    ...managementProps,
    handleFileChange,
    handleExportClick,
    handlePayeeNameClick,
    selectedPayee: managementProps.selectedEntity,
  };
};
