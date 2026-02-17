"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const security_1 = require("./security");
let mainWindow = null;
let isQuitting = false;
let authorizedBackupFolders = new Set();
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
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
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
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
    const backupConfigPath = path_1.default.join(electron_1.app.getPath('userData'), 'backup-config.json');
    authorizedBackupFolders = (0, security_1.loadAuthorizedFolders)(backupConfigPath);
    electron_1.ipcMain.handle('select-folder', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'createDirectory'],
        });
        if (result.canceled)
            return null;
        const selectedPath = result.filePaths[0];
        // SECURITY: Authorize the selected folder
        authorizedBackupFolders.add(selectedPath);
        (0, security_1.saveAuthorizedFolders)(backupConfigPath, authorizedBackupFolders);
        return selectedPath;
    }));
    electron_1.ipcMain.handle('write-backup-file', (_event, folder, filename, content) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // SECURITY: Prevent path traversal
            if (path_1.default.basename(filename) !== filename || filename === '..' || filename === '.') {
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
            if (!(0, security_1.isFolderAuthorized)(folder, authorizedBackupFolders)) {
                console.error("Security alert: Unauthorized backup folder attempt", folder);
                throw new Error("Unauthorized backup folder. Please re-select the folder in settings.");
            }
            // Ensure directory exists
            if (!fs_1.default.existsSync(folder)) {
                fs_1.default.mkdirSync(folder, { recursive: true });
            }
            const filePath = path_1.default.join(folder, filename);
            yield fs_1.default.promises.writeFile(filePath, content, 'utf-8');
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
