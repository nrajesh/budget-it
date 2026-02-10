export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  saveBackup: (
    folder: string,
    filename: string,
    content: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
