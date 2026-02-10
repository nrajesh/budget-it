import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    saveBackup: (folder: string, filename: string, content: string) => ipcRenderer.invoke('write-backup-file', folder, filename, content),
});
