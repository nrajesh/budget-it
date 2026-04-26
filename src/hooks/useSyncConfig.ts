import { useState, useEffect } from "react";
import { SyncDirectoryConfig } from "@/types/sync";
import { selectSyncDirectory, checkSyncPermission } from "@/utils/fs-adapter";
import { isElectron } from "@/utils/electron";
import { Capacitor } from "@capacitor/core";
import { set, get, del } from "idb-keyval"; // IDB is required for Web FileSystemDirectoryHandle to persist
import { toast } from "sonner";

const SYNC_STORAGE_KEY = "vaultedmoney_sync_config";
const LEGACY_SYNC_STORAGE_KEY = "budget_it_sync_config";

export const useSyncConfig = () => {
  const [config, setConfig] = useState<SyncDirectoryConfig>({
    syncDirectoryHandle: null,
    autoSyncEnabled: false,
    lastSyncTimestamp: null,
  });

  const [isReady, setIsReady] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        let savedConfig = await get<SyncDirectoryConfig>(SYNC_STORAGE_KEY);
        if (!savedConfig) {
          const legacy = await get<SyncDirectoryConfig>(LEGACY_SYNC_STORAGE_KEY);
          if (legacy) {
            savedConfig = legacy;
            await set(SYNC_STORAGE_KEY, legacy);
            await del(LEGACY_SYNC_STORAGE_KEY);
          }
        }
        if (savedConfig) {
          setConfig(savedConfig);

          // If auto-sync is enabled, check if we still have permission to access the folder
          if (savedConfig.autoSyncEnabled && savedConfig.syncDirectoryHandle) {
            const hasAccess = await checkSyncPermission(
              savedConfig.syncDirectoryHandle,
              false, // don't prompt on boot
            );
            if (!hasAccess) {
              setNeedsPermission(true);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load sync configuration:", err);
      } finally {
        setIsReady(true);
      }
    };
    loadConfig();
  }, []);

  // Save config whenever it changes
  useEffect(() => {
    if (isReady) {
      set(SYNC_STORAGE_KEY, config).catch((err: unknown) =>
        console.error("Failed to save sync config:", err),
      );
    }
  }, [config, isReady]);

  const selectFolder = async () => {
    try {
      const handle = await selectSyncDirectory();
      if (handle) {
        setConfig((prev) => ({
          ...prev,
          syncDirectoryHandle: handle,
        }));
        setNeedsPermission(false);
        return true;
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Failed to select folder:", err);
        toast.error(err.message, { duration: 7000 });
      }
    }
    return false;
  };

  const toggleAutoSync = (enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      autoSyncEnabled: enabled,
    }));
  };

  const updateLastSync = () => {
    setConfig((prev) => ({
      ...prev,
      lastSyncTimestamp: Date.now(),
    }));
  };

  const requestPermission = async () => {
    if (config.syncDirectoryHandle) {
      const hasAccess = await checkSyncPermission(
        config.syncDirectoryHandle,
        true,
      );
      if (hasAccess) {
        setNeedsPermission(false);
        return true;
      }
    }
    return false;
  };

  return {
    config,
    isReady,
    needsPermission,
    isElectron: isElectron(),
    isCapacitor: Capacitor.isNativePlatform(),
    selectFolder,
    toggleAutoSync,
    updateLastSync,
    requestPermission,
  };
};
