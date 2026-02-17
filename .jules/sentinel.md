# Sentinel's Journal

## 2025-05-18 - Path Traversal in Electron IPC
**Vulnerability:** The `write-backup-file` IPC handler joined a user-provided `folder` with a `filename` without validation.
**Learning:** `path.join()` in Node.js discards previous segments if a segment is an absolute path (e.g., `path.join('/safe/dir', '/etc/passwd')` returns `/etc/passwd`). This allowed arbitrary file overwrites even if the `folder` argument was fixed/safe (though in this case it wasn't).
**Prevention:** Always validate `filename` arguments in IPC handlers to ensure they are relative and contain no path separators (`/` or `\`) or `..` segments. Use `path.basename()` and explicit checks.

## 2025-05-18 - Content Security Policy in Vite/Electron
**Vulnerability:** Missing CSP headers in Electron allowed potential XSS.
**Learning:** Adding CSP to `index.html` breaks Vite's dev server due to inline scripts used for HMR. Using `vite-plugin-html` or a custom inline plugin with `apply: 'build'` is critical to secure production without breaking development.
**Prevention:** Use a build-time transform to inject strict CSP meta tags only for production builds.

## 2025-10-26 - Arbitrary File Write via Extension Bypass
**Vulnerability:** The `write-backup-file` IPC handler allowed saving files with any extension, enabling attackers to write executable files (e.g., `.sh`, `.bat`) if they could control the filename argument.
**Learning:** Even with path traversal protection (using `path.basename`), unrestricted file extensions in file-write operations can lead to Remote Code Execution (RCE) by writing startup scripts or executables.
**Prevention:** Enforce a strict allowlist of file extensions (e.g., `.json`, `.lock`) in the Main process for any IPC handler that writes files.

## 2025-05-18 - CSV Injection (Formula Injection)
**Vulnerability:** User input exported to CSV files was not sanitized, allowing formulas (starting with `=`, `+`, `-`, `@`) to execute when opened in spreadsheet software.
**Learning:** Even if `sanitizeCSVField` is applied, valid numeric values like `-100` must be preserved as numbers while still escaping malicious formulas like `+cmd|' /C calc'!A0`. A regex check for valid numeric format is crucial before escaping.
**Prevention:** Implement `sanitizeCSVField` that checks for dangerous prefixes but whitelists valid numeric strings to avoid breaking legitimate data.

## 2025-05-18 - Arbitrary File Write via Unrestricted Folder IPC
**Vulnerability:** The `write-backup-file` IPC handler accepted any `folder` path from the renderer, allowing a compromised renderer to write files to any user-writable directory (e.g., config locations, autostart folders) even if the filename was sanitized.
**Learning:** Sanitizing filenames is insufficient if the directory path itself is trusted from the client. Electron IPC handlers must authorize the target directory, especially for file write operations.
**Prevention:** Implement an allowlist of authorized directories in the Main process. Update the allowlist only when the user explicitly selects a folder via a Main-controlled dialog (`dialog.showOpenDialog`). Validate all write requests against this allowlist.
