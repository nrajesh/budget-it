# Research: Cross-Device Continuity via Local Folder

## Decision: File System Access API (Web) & Native `fs` (Electron)

**Rationale**: 
To satisfy the requirement of reading from and writing to a specific user-designated local folder (like an iCloud or Google Drive folder) without manual file picker dialogues every time, we need persistent access to that folder.
- **Web**: The relatively modern [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) allows web applications to request access to a local directory (`showDirectoryPicker()`). The resulting `FileSystemDirectoryHandle` can be serialized and stored in IndexedDB (e.g., via Dexie or `idb-keyval`). On subsequent visits, the app can retrieve this handle, silently (or with a one-click permission prompt) ask the user to verify access, and then automatically sync data.
- **Electron**: Electron has full Node.js `fs` access. We can use `dialog.showOpenDialog({ properties: ['openDirectory'] })` to get the path, save the path string in local storage or the Electron store, and use `fs.readFileSync`/`writeFileSync` for seamless syncs.

**Alternatives Considered**:
- *Cloud Provider APIs (Google Drive API, Dropbox API)*: Rejected because it breaks the local-first, offline-first constraint and requires OAuth setup, API keys, and server infrastructure.
- *CRDTs with WebRTC*: Rejected as it requires both devices to be online simultaneously for peer-to-peer sync, which doesn't fit the asynchronous use case of jumping between devices at different times.

## Implementation Unknowns Resolved
- **Web Permission Persistence**: Directory handles can be stored in IndexedDB. When retrieved later, `verifyPermission()` must be called. If it returns 'prompt', a user gesture is required to regain access. We will handle this gracefully in the UI on startup.
