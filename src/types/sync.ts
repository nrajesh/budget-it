export interface SyncPayloadEnvelope {
  appVersion: string;
  schemaVersion: number;
  data: any;
  exportTimestamp: string;
}

export interface SyncDirectoryConfig {
  syncDirectoryHandle: any; // FileSystemDirectoryHandle (Web) or string (Electron)
  autoSyncEnabled: boolean;
  lastSyncTimestamp: number | null;
}
