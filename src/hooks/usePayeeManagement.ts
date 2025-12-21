import * as React from "react";
import { useEntityManagement } from "./useEntityManagement";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Payee } from "@/components/AddEditPayeeDialog";
import Papa from "papaparse";
import { showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";

export const usePayeeManagement = (isAccount: boolean) => {
  const { invalidateAllData } = useTransactions();
  const navigate = useNavigate();

  const entityName = isAccount ? "Account" : "Vendor";
  const entityNamePlural = isAccount ? "accounts" : "vendors";

  const managementProps = useEntityManagement<Payee>({
    entityName,
    entityNamePlural,
    queryKey: [entityNamePlural],
    deleteRpcFn: 'delete_payees_batch',
    batchUpsertRpcFn: isAccount ? 'batch_upsert_accounts' : 'batch_upsert_vendors',
    batchUpsertPayloadKey: isAccount ? 'p_accounts' : 'p_names',
    isDeletable: (item) => item.name !== 'Others',
    onSuccess: invalidateAllData,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    managementProps.batchUpsertMutation.reset(); // Reset mutation state
    const setIsImporting = (managementProps as any).setIsImporting; // A bit of a hack, ideally the hook would expose this
    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredHeaders = isAccount ? ["Account Name", "Currency", "Starting Balance", "Remarks"] : ["Vendor Name"];
        const hasAllHeaders = requiredHeaders.every(h => results.meta.fields?.includes(h));

        if (!hasAllHeaders) {
          showError(`CSV is missing required headers: ${requiredHeaders.join(", ")}`);
          setIsImporting(false);
          return;
        }

        const dataToUpsert = results.data.map((row: any) => isAccount
          ? { name: row["Account Name"], currency: row["Currency"], starting_balance: parseFloat(row["Starting Balance"]) || 0, remarks: row["Remarks"] }
          : { name: row["Vendor Name"] }
        ).filter(item => item.name);

        if (dataToUpsert.length === 0) {
          showError(`No valid ${entityName.toLowerCase()} data found in the CSV file.`);
          setIsImporting(false);
          return;
        }
        managementProps.batchUpsertMutation.mutate(dataToUpsert);
      },
      error: (error: any) => {
        showError(`CSV parsing error: ${error.message}`);
        setIsImporting(false);
      },
    });
  };

  const handleExportClick = (payees: Payee[]) => {
    if (payees.length === 0) {
      showError(`No ${entityNamePlural} to export.`);
      return;
    }
    const dataToExport = payees.map(p => isAccount
      ? { "Account Name": p.name, "Currency": p.currency, "Starting Balance": p.starting_balance, "Remarks": p.remarks }
      : { "Vendor Name": p.name }
    );
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `${entityNamePlural}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePayeeNameClick = (payeeName: string) => {
    const filterKey = isAccount ? 'filterAccount' : 'filterVendor';
    navigate('/transactions', { state: { [filterKey]: payeeName } });
  };

  return {
    ...managementProps,
    handleFileChange,
    handleExportClick,
    handlePayeeNameClick,
    selectedPayee: managementProps.selectedEntity, // Alias for clarity
  };
};