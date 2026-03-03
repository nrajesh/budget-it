export interface SyncPayloadEnvelope {
  appVersion: string;
  schemaVersion: number;
  data: unknown;
  exportTimestamp: string;
}

export interface SyncDirectoryConfig {
  syncDirectoryHandle: unknown; // FileSystemDirectoryHandle (Web) or string (Electron)
  autoSyncEnabled: boolean;
  lastSyncTimestamp: number | null;
}
