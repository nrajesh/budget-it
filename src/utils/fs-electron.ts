import { ElectronAPI } from "./electron";

/**
 * Wrapper for Electron fs API
 * Relies on the preload script exposing ipcRenderer methods
 */

export const getElectronDirectoryPath = async (): Promise<string | null> => {
  // We assume the preload script provides `window.electron.selectDirectory`
  const electron = (window as unknown as { electron?: ElectronAPI }).electron;
  if (electron?.selectDirectory) {
    return await electron.selectDirectory();
  }
  return null;
};

export const verifyElectronPermission = async (
  path: string,
): Promise<boolean> => {
  // In Electron, once we have the path, we can usually read/write it
  const electron = (window as unknown as { electron?: ElectronAPI }).electron;
  if (electron?.checkDirectoryAccess) {
    return await electron.checkDirectoryAccess(path);
  }
  return !!path;
};

export const readElectronFile = async (
  path: string,
  filename: string,
): Promise<string> => {
  const electron = (window as unknown as { electron?: ElectronAPI }).electron;
  if (electron?.joinPath && electron?.readFile) {
    const fullPath = await electron.joinPath(path, filename);
    return await electron.readFile(fullPath);
  }
  if (electron?.readFile) {
    const fullPath = `${path}/${filename}`;
    return await electron.readFile(fullPath);
  }
  throw new Error("Electron readFile API not available");
};

export const writeElectronFile = async (
  path: string,
  filename: string,
  content: string,
): Promise<void> => {
  const electron = (window as unknown as { electron?: ElectronAPI }).electron;
  if (electron?.joinPath && electron?.writeFile) {
    const fullPath = await electron.joinPath(path, filename);
    await electron.writeFile(fullPath, content);
    return;
  }
  if (electron?.writeFile) {
    const fullPath = `${path}/${filename}`;
    await electron.writeFile(fullPath, content);
    return;
  }
  throw new Error("Electron writeFile API not available");
};
