export const isElectron = (): boolean => {
  return (
    typeof window !== "undefined" &&
    !!(window as unknown as { electron?: ElectronAPI }).electron
  );
};

export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  saveBackup: (
    folder: string,
    filename: string,
    content: string,
  ) => Promise<{ success: boolean; error?: string }>;
  selectDirectory?: () => Promise<string | null>;
  checkDirectoryAccess?: (path: string) => Promise<boolean>;
  readFile?: (path: string) => Promise<string>;
  writeFile?: (path: string, content: string) => Promise<void>;
  joinPath?: (...paths: string[]) => Promise<string>;
}

export const getElectronAPI = (): ElectronAPI | null => {
  if (isElectron()) {
    return (window as unknown as { electron?: ElectronAPI }).electron || null;
  }
  return null;
};
