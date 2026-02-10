import { useEffect } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { db } from "@/lib/dexieDB";
import { useDataProvider } from "@/context/DataProviderContext";
import { generateBackupData } from "@/utils/backupUtils";
import { encryptData } from "@/utils/crypto";
import { getElectronAPI } from "@/utils/electron";

const BackupManager = () => {
    const dataProvider = useDataProvider();

    useEffect(() => {
        const checkBackups = async () => {
            const now = new Date();
            const backups = await db.backup_configs.where('nextBackup').belowOrEqual(now.toISOString()).toArray();
            const electron = getElectronAPI();

            for (const backup of backups) {
                if (!backup.isActive || (!backup.directoryHandle && !backup.path)) continue;

                let isSuccess = false;
                try {
                    console.log(`[BackupManager] Running backup for config ${backup.id}`);

                    // 1. Generate Data
                    const data = await generateBackupData(dataProvider);
                    let content = JSON.stringify(data, null, 2);
                    let filename = `backup_${backup.id.substring(0, 8)}_${now.toISOString().replace(/[:.]/g, '-')}.json`;

                    // 2. Encrypt if needed
                    if (backup.encrypted && backup.passwordHash) {
                        content = await encryptData(content, backup.passwordHash);
                        filename = filename.replace('.json', '.lock');
                    }

                    // 3. Write to File System
                    if (backup.path && electron) {
                        const result = await electron.saveBackup(backup.path, filename, content);
                        if (!result.success) {
                            throw new Error(result.error || "Electron backup failed");
                        }
                    } else if (backup.directoryHandle) {
                        const dirHandle = backup.directoryHandle;

                        // Check permission status first
                        const permState = await dirHandle.queryPermission({ mode: 'readwrite' });

                        if (permState !== 'granted') {
                            console.warn(`[BackupManager] Permission needed for config ${backup.id}`);
                            // We don't error out here, we just skip and let it reschedule? 
                            // Or we should pause it?
                            // For now, let's treat it as a skip but update time so we don't spam.
                            // But show a toast once?
                        } else {
                            const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
                            const writable = await fileHandle.createWritable();
                            await writable.write(content);
                            await writable.close();
                        }
                    } else {
                        console.warn(`[BackupManager] No valid target for config ${backup.id}`);
                        continue;
                    }

                    isSuccess = true;
                    showSuccess(`Scheduled backup completed (${filename})`);

                } catch (e: any) {
                    console.error("[BackupManager] Backup failed:", e);

                    if (e.name === 'NotFoundError') {
                        showError(`Backup folder not found for config ${backup.id}. Backup disabled.`);
                        await db.backup_configs.update(backup.id, { isActive: false });
                    } else if (e.name === 'NotAllowedError') {
                        showError(`Permission denied for backup config ${backup.id}. Backup disabled.`);
                        await db.backup_configs.update(backup.id, { isActive: false });
                    }
                }

                // 4. Update Schedule (Always advance time to avoid stuck loop)
                const nextRun = new Date(now.getTime() + backup.frequency);
                const updatePayload: any = {
                    nextBackup: nextRun.toISOString()
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
