import { useEffect } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { db } from "@/lib/dexieDB";
import { useDataProvider } from "@/context/DataProviderContext";
import { generateBackupData } from "@/utils/backupUtils";
import { encryptData } from "@/utils/crypto";
import { writeSyncFile } from "@/utils/fs-adapter";



const BackupManager = () => {
  const dataProvider = useDataProvider();

  useEffect(() => {
    const checkBackups = async () => {
      const now = new Date();
      const backups = await db.backup_configs
        .where("nextBackup")
        .belowOrEqual(now.toISOString())
        .toArray();


      for (const backup of backups) {
        if (!backup.isActive || (!backup.directoryHandle && !backup.path))
          continue;

        let isSuccess = false;
        try {
          console.log(`[BackupManager] Running backup for config ${backup.id}`);

          // 1. Generate Data
          const data = await generateBackupData(dataProvider);
          let content = JSON.stringify(data, null, 2);
          let filename = `backup_${backup.id.substring(0, 8)}_${now.toISOString().replace(/[:.]/g, "-")}.json`;

          // 2. Encrypt if needed
          if (backup.encrypted && backup.passwordHash) {
            content = await encryptData(content, backup.passwordHash);
            filename = filename.replace(".json", ".lock");
          }

          // 3. Write to File System using Adapter
          const handleOrPath = backup.path || backup.directoryHandle;
          if (!handleOrPath) {
            console.warn(
              `[BackupManager] No valid target for config ${backup.id}`,
            );
            continue;
          }

          await writeSyncFile(handleOrPath, filename, content);


          isSuccess = true;
          showSuccess(`Scheduled backup completed (${filename})`);
        } catch (e: unknown) {
          console.error("[BackupManager] Backup failed:", e);
          const error = e as Error;

          if (error.name === "NotFoundError") {
            showError(
              `Backup folder not found for config ${backup.id}. Backup disabled.`,
            );
            await db.backup_configs.update(backup.id, { isActive: false });
          } else if (error.name === "NotAllowedError") {
            showError(
              `Permission denied for backup config ${backup.id}. Backup disabled.`,
            );
            await db.backup_configs.update(backup.id, { isActive: false });
          }
        }

        // 4. Update Schedule (Always advance time to avoid stuck loop)
        const nextRun = new Date(now.getTime() + backup.frequency);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatePayload: any = {
          nextBackup: nextRun.toISOString(),
        };

        if (isSuccess) {
          updatePayload.lastBackup = now.toISOString();
        }

        await db.backup_configs.update(backup.id, updatePayload);
      }
    };

    const intervalId = setInterval(checkBackups, 60 * 1000); // Check every minute

    // Initial check on mount
    checkBackups();

    return () => clearInterval(intervalId);
  }, [dataProvider]);

  return null; // Headless component
};

export default BackupManager;
