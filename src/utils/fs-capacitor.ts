import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';

/**
 * Wrapper for the Native Capacitor File System API (iOS/Android)
 */

export const getCapacitorDirectoryHandle = async (): Promise<string> => {
    try {
        const result = await FilePicker.pickDirectory();
        // The picker returns a result with a path/uri
        // We return the path for future file operations
        return result.path;
    } catch (err) {
        console.error("Failed to pick directory:", err);
        throw err;
    }
};

export const verifyCapacitorPermission = async (): Promise<boolean> => {
    try {
        const statuses = await Filesystem.checkPermissions();

        if (statuses.publicStorage === 'granted') {
            return true;
        }

        const request = await Filesystem.requestPermissions();
        return request.publicStorage === 'granted';
    } catch (err) {
        console.warn("Permission check failed or not required on this OS:", err);
        // On iOS, the Documents directory is automatically accessible without explicit requests.
        return true;
    }
};

export const readCapacitorFile = async (
    path: string,
    filename: string,
): Promise<string> => {
    // If we have a custom path from the picker, we use it as the base
    const fullPath = path && path !== "NATIVE_DOCUMENTS_DIRECTORY"
        ? `${path}/${filename}`
        : filename;

    const contents = await Filesystem.readFile({
        path: fullPath,
        // If path is absolute (from picker), we don't specify the directory property
        ...(path && path !== "NATIVE_DOCUMENTS_DIRECTORY" ? {} : { directory: Directory.Documents }),
        encoding: Encoding.UTF8,
    });

    return contents.data as string;
};

export const writeCapacitorFile = async (
    path: string,
    filename: string,
    content: string,
): Promise<void> => {
    const fullPath = path && path !== "NATIVE_DOCUMENTS_DIRECTORY"
        ? `${path}/${filename}`
        : filename;

    await Filesystem.writeFile({
        path: fullPath,
        data: content,
        ...(path && path !== "NATIVE_DOCUMENTS_DIRECTORY" ? {} : { directory: Directory.Documents }),
        encoding: Encoding.UTF8,
        recursive: true
    });
};
