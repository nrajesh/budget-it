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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const Security = __importStar(require("./security"));
let mainWindow = null;
let isQuitting = false;
let authorizedBackupFolders = new Set();
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
        },
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.hide();
            return false;
        }
    });
}
electron_1.app.on('before-quit', () => {
    isQuitting = true;
});
electron_1.app.whenReady().then(() => {
    createWindow();
    // Initialize authorized folders from config
    const backupConfigPath = path.join(electron_1.app.getPath('userData'), 'backup-config.json');
    authorizedBackupFolders = Security.loadAuthorizedFolders(backupConfigPath);
    electron_1.ipcMain.handle('select-folder', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'createDirectory'],
        });
        if (result.canceled)
            return null;
        const selectedPath = result.filePaths[0];
        // SECURITY: Authorize the selected folder
        authorizedBackupFolders.add(selectedPath);
        Security.saveAuthorizedFolders(backupConfigPath, authorizedBackupFolders);
        return selectedPath;
    }));
    electron_1.ipcMain.handle('write-backup-file', (_event, folder, filename, content) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // SECURITY: Prevent path traversal
            if (path.basename(filename) !== filename || filename === '..' || filename === '.') {
                console.error("Security alert: Attempted path traversal in filename", filename);
                throw new Error("Invalid filename: Path traversal detected");
            }
            // SECURITY: Enforce file extension to prevent arbitrary file write
            if (!filename.endsWith('.json') && !filename.endsWith('.lock') && !filename.endsWith('.csv')) {
                console.error("Security alert: Invalid file extension", filename);
                throw new Error("Invalid filename: Only .json, .csv, and .lock files are allowed");
            }
            // SECURITY: Validate folder authorization
            // Prevent arbitrary file writes to unauthorized locations
            if (!Security.isFolderAuthorized(folder, authorizedBackupFolders)) {
                console.error("Security alert: Unauthorized backup folder attempt", folder);
                throw new Error("Unauthorized backup folder. Please re-select the folder in settings.");
            }
            // Ensure directory exists
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true });
            }
            const filePath = path.join(folder, filename);
            yield fs.promises.writeFile(filePath, content, 'utf-8');
            return { success: true };
        }
        catch (error) {
            console.error("Backup write failed:", error);
            return { success: false, error: error.message };
        }
    }));
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
        else if (mainWindow) {
            mainWindow.show();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
