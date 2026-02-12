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
}

export const getElectronAPI = (): ElectronAPI | null => {
  if (isElectron()) {
    return (window as unknown as { electron?: ElectronAPI }).electron || null;
  }
  return null;
};
