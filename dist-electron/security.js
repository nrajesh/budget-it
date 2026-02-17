"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAuthorizedFolders = loadAuthorizedFolders;
exports.saveAuthorizedFolders = saveAuthorizedFolders;
exports.isFolderAuthorized = isFolderAuthorized;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function loadAuthorizedFolders(configPath) {
    try {
        if (!fs_1.default.existsSync(configPath)) {
            return new Set();
        }
        const data = fs_1.default.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(data);
        if (Array.isArray(config.authorizedFolders)) {
            return new Set(config.authorizedFolders.map((f) => path_1.default.normalize(f)));
        }
        return new Set();
    }
    catch (error) {
        console.error("Failed to load backup config:", error);
        return new Set();
    }
}
function saveAuthorizedFolders(configPath, folders) {
    try {
        const config = {
            authorizedFolders: Array.from(folders).map(f => path_1.default.normalize(f))
        };
        // Ensure directory exists
        const dir = path_1.default.dirname(configPath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    catch (error) {
        console.error("Failed to save backup config:", error);
    }
}
function isFolderAuthorized(folder, authorizedFolders) {
    if (!folder)
        return false;
    const normalizedFolder = path_1.default.normalize(folder);
    return authorizedFolders.has(normalizedFolder);
}
