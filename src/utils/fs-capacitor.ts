import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

/**
 * Wrapper for the Native Capacitor File System API (iOS/Android)
 */

export const getCapacitorDirectoryHandle = async (): Promise<string> => {
    // In Capacitor, we don't open a "picker" because of mobile OS sandboxing.
    // Instead, we just acknowledge and return a static reference to the app's native Documents directory.
    // The actual read/write operations will use this directory.
    return "NATIVE_DOCUMENTS_DIRECTORY";
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

export const readCapacitorFile = async (filename: string): Promise<string> => {
    const contents = await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
    });

    // Capacitor's readFile returns { data: string | Blob }
    return contents.data as string;
};

export const writeCapacitorFile = async (
    filename: string,
    content: string,
): Promise<void> => {
    await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
    });
};
