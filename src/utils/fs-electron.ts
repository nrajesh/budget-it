import { ElectronAPI } from "./electron";

/**
 * Wrapper for Electron fs API
 * Relies on the preload script exposing ipcRenderer methods
 */

export const getElectronDirectoryPath = async (): Promise<string | null> => {
  const electron = (window as unknown as { electron?: ElectronAPI }).electron;
  if (!electron) return null;
  return await electron.selectDirectory();
};

export const verifyElectronPermission = async (
  path: string,
): Promise<boolean> => {
  const electron = (window as unknown as { electron?: ElectronAPI }).electron;
  if (!electron) return !!path;
  return await electron.checkDirectoryAccess(path);
};

export const readElectronFile = async (
  path: string,
  filename: string,
): Promise<string> => {
  const electron = (window as unknown as { electron?: ElectronAPI }).electron;
  if (!electron) throw new Error("Electron API not available");
  const fullPath = await electron.joinPath(path, filename);
  return await electron.readFile(fullPath);
};

export const writeElectronFile = async (
  path: string,
  filename: string,
  content: string,
): Promise<void> => {
  const electron = (window as unknown as { electron?: ElectronAPI }).electron;
  if (!electron) throw new Error("Electron API not available");
  const fullPath = await electron.joinPath(path, filename);
  await electron.writeFile(fullPath, content);
};
