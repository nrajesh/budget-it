"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    selectFolder: () => electron_1.ipcRenderer.invoke('select-folder'),
    saveBackup: (folder, filename, content) => electron_1.ipcRenderer.invoke('write-backup-file', folder, filename, content),
});
