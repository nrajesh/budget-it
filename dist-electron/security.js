"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAuthorizedFolders = loadAuthorizedFolders;
exports.saveAuthorizedFolders = saveAuthorizedFolders;
exports.isFolderAuthorized = isFolderAuthorized;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function loadAuthorizedFolders(configPath) {
    try {
        if (!fs.existsSync(configPath)) {
            return new Set();
        }
        const data = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(data);
        if (Array.isArray(config.authorizedFolders)) {
            return new Set(config.authorizedFolders.map((f) => path.normalize(f)));
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
            authorizedFolders: Array.from(folders).map(f => path.normalize(f))
        };
        // Ensure directory exists
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    catch (error) {
        console.error("Failed to save backup config:", error);
    }
}
function isFolderAuthorized(folder, authorizedFolders) {
    if (!folder)
        return false;
    const normalizedFolder = path.normalize(folder);
    return authorizedFolders.has(normalizedFolder);
}
