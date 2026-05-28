import { contextBridge, ipcRenderer } from "electron";
import * as path from "path";

contextBridge.exposeInMainWorld("electron", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  saveBackup: (folder: string, filename: string, content: string) =>
    ipcRenderer.invoke("write-backup-file", folder, filename, content),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  checkDirectoryAccess: (dirPath: string) =>
    ipcRenderer.invoke("check-directory-access", dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke("write-file", filePath, content),
  joinPath: (...paths: string[]) => Promise.resolve(path.join(...paths)),
});
