# Data Model: Auto-Import

## Entities

### `AppSettings` / `AppPreferences` (Existing)
*Modified to include sync preferences.*

- **`syncDirectoryHandle`**: `FileSystemDirectoryHandle | null` (Web) or `string | null` (Electron)
  - Records the user's default sync directory for auto-import/export.
- **`autoSyncEnabled`**: `boolean` (Default: `false`)
  - Enables or disables the continuity feature.
- **`lastSyncTimestamp`**: `number | null`
  - Records the last successful sync. Can be used for conflict resolution if implementing more advanced CRDTs in the future.

### `SyncPayloadEnvelope` (New)
*A wrapper for exported data to ensure version compatibility during import.*
- **`appVersion`**: `string` (e.g., "1.0.0")
- **`schemaVersion`**: `number` (e.g., 8, matching Dexie schema version)
- **`data`**: `any` (The actual payload from the database)
- **`exportTimestamp`**: `string` (ISO date)
