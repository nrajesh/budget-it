import { useEffect, useState, useRef } from "react";
import { useSyncConfig } from "./useSyncConfig";
import { readSyncFile, writeSyncFile } from "@/utils/fs-adapter";
import { useLedger } from "@/contexts/LedgerContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { generateBackupData, processImport } from "@/utils/backupUtils";
import { toast } from "sonner";
import { SyncPayloadEnvelope } from "@/types/sync";

export const useContinuitySync = () => {
  const { config, isReady, needsPermission, updateLastSync } = useSyncConfig();
  const { switchLedger } = useLedger(); // Changed from dataProvider, setActiveLedger
  const dataProvider = useDataProvider(); // Added this line

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const hasImportedOnBoot = useRef(false);

  // Auto-Import on Boot
  useEffect(() => {
    if (!isReady || hasImportedOnBoot.current) return;
    if (
      !config.autoSyncEnabled ||
      !config.syncDirectoryHandle ||
      needsPermission
    )
      return;

    const performBootImport = async () => {
      hasImportedOnBoot.current = true;
      setIsSyncing(true);
      setSyncError(null);

      try {
        const fileContent = await readSyncFile(
          config.syncDirectoryHandle,
          "ledger.json",
        );

        if (fileContent) {
          const importResult = await processImport(fileContent, dataProvider);

          if (importResult.type === "success") {
            // Successfully imported, trigger a re-render/re-fetch in the app
            const ledgers = await dataProvider.getLedgers();
            if (ledgers.length > 0) {
              await switchLedger(ledgers[0].id, ledgers[0]);
            }
            toast.success("Sync data auto-imported successfully.");
            updateLastSync();
          } else if (importResult.type === "warning") {
            // Handle version mismatch warning
            // Ideally we would prompt the user here, but for auto-import, we
            // might just want to show a strong warning and skip, or proceed depending on UX.
            // We will proceed for now but show a persistent warning toast.
            toast.error(importResult.message, { duration: 10000 });
            await dataProvider.importData(importResult.dataToImport);
            const ledgers = await dataProvider.getLedgers();
            if (ledgers.length > 0) {
              await switchLedger(ledgers[0].id, ledgers[0]);
            }
            updateLastSync();
          } else if (importResult.type === "error") {
            throw new Error(importResult.message);
          } else if (importResult.type === "encrypted") {
            toast.error(
              "Auto-import failed: Sync file is encrypted. Manual import required.",
            );
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "NotFoundError") {
          // It's okay if the file doesn't exist yet, it means this is the first sync
          console.log(
            "No ledger.json found in sync directory. A new one will be created on next change.",
          );
        } else {
          console.error("Failed to auto-import sync data:", err);
          setSyncError(
            err instanceof Error
              ? err.message
              : "Unknown error during sync import",
          );
          toast.error("Failed to auto-import sync data. Using local cache.");
        }
      } finally {
        setIsSyncing(false);
      }
    };

    performBootImport();
  }, [
    isReady,
    config,
    needsPermission,
    dataProvider,
    switchLedger,
    updateLastSync,
  ]);

  // Manual Trigger for Auto-Export (to be called when mutations happen)
  const triggerExport = async () => {
    if (
      !config.autoSyncEnabled ||
      !config.syncDirectoryHandle ||
      needsPermission
    )
      return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const payload: SyncPayloadEnvelope =
        await generateBackupData(dataProvider);
      const jsonString = JSON.stringify(payload, null, 2);

      await writeSyncFile(
        config.syncDirectoryHandle,
        "ledger.json",
        jsonString,
      );

      updateLastSync();
    } catch (err: unknown) {
      console.error("Failed to auto-export sync data:", err);
      setSyncError(
        err instanceof Error ? err.message : "Unknown error during sync export",
      );
      toast.error("Failed to sync changes to default folder.");
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    syncError,
    triggerExport,
  };
};
