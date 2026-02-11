# Sentinel's Journal

## 2025-05-18 - Path Traversal in Electron IPC
**Vulnerability:** The `write-backup-file` IPC handler joined a user-provided `folder` with a `filename` without validation.
**Learning:** `path.join()` in Node.js discards previous segments if a segment is an absolute path (e.g., `path.join('/safe/dir', '/etc/passwd')` returns `/etc/passwd`). This allowed arbitrary file overwrites even if the `folder` argument was fixed/safe (though in this case it wasn't).
**Prevention:** Always validate `filename` arguments in IPC handlers to ensure they are relative and contain no path separators (`/` or `\`) or `..` segments. Use `path.basename()` and explicit checks.
