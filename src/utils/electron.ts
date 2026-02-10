export const isElectron = (): boolean => {
    return typeof window !== 'undefined' && !!(window as any).electron;
};

export interface ElectronAPI {
    selectFolder: () => Promise<string | null>;
    saveBackup: (folder: string, filename: string, content: string) => Promise<{ success: boolean; error?: string }>;
}

export const getElectronAPI = (): ElectronAPI | null => {
    if (isElectron()) {
        return (window as any).electron;
    }
    return null;
};
