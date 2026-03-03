import { Capacitor } from '@capacitor/core';
import { isElectron } from "./electron";
import {
    getWebDirectoryHandle,
    verifyWebPermission,
    readWebFile,
    writeWebFile,
} from "./fs-web";
import {
    getElectronDirectoryPath,
    verifyElectronPermission,
    readElectronFile,
    writeElectronFile,
} from "./fs-electron";
import {
    getCapacitorDirectoryHandle,
    verifyCapacitorPermission,
    readCapacitorFile,
    writeCapacitorFile,
} from "./fs-capacitor";

export const selectSyncDirectory = async (): Promise<any> => {
    if (Capacitor.isNativePlatform()) {
        return await getCapacitorDirectoryHandle();
    } else if (isElectron()) {
        return await getElectronDirectoryPath();
    } else {
        return await getWebDirectoryHandle();
    }
};

export const checkSyncPermission = async (
    handleOrPath: any,
    withPrompt = true,
): Promise<boolean> => {
    if (!handleOrPath) return false;

    if (Capacitor.isNativePlatform()) {
        return await verifyCapacitorPermission();
    } else if (isElectron()) {
        return await verifyElectronPermission(handleOrPath as string);
    } else {
        return await verifyWebPermission(
            handleOrPath as FileSystemDirectoryHandle,
            withPrompt,
        );
    }
};

export const readSyncFile = async (
    handleOrPath: any,
    filename: string,
): Promise<string> => {
    if (Capacitor.isNativePlatform()) {
        return await readCapacitorFile(handleOrPath as string, filename);
    } else if (isElectron()) {
        return await readElectronFile(handleOrPath as string, filename);
    } else {
        return await readWebFile(handleOrPath as FileSystemDirectoryHandle, filename);
    }
};

export const writeSyncFile = async (
    handleOrPath: any,
    filename: string,
    content: string,
): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
        await writeCapacitorFile(handleOrPath as string, filename, content);
    } else if (isElectron()) {
        await writeElectronFile(handleOrPath as string, filename, content);
    } else {
        await writeWebFile(
            handleOrPath as FileSystemDirectoryHandle,
            filename,
            content,
        );
    }
};
