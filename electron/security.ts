import * as fs from 'fs';
import * as path from 'path';

export function loadAuthorizedFolders(configPath: string): Set<string> {
    try {
        if (!fs.existsSync(configPath)) {
            return new Set();
        }
        const data = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(data);
        if (Array.isArray(config.authorizedFolders)) {
            return new Set(config.authorizedFolders.map((f: string) => path.normalize(f)));
        }
        return new Set();
    } catch (error) {
        console.error("Failed to load backup config:", error);
        return new Set();
    }
}

export function saveAuthorizedFolders(configPath: string, folders: Set<string>): void {
    try {
        const config = {
            authorizedFolders: Array.from(folders).map(f => path.normalize(f))
        };
        // Ensure directory exists
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        console.error("Failed to save backup config:", error);
    }
}

export function isFolderAuthorized(folder: string, authorizedFolders: Set<string>): boolean {
    if (!folder) return false;
    const normalizedFolder = path.normalize(folder);
    return authorizedFolders.has(normalizedFolder);
}
