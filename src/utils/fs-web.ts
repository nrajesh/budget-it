/**
 * Wrapper for the Web File System Access API
 */

export const getWebDirectoryHandle =
  async (): Promise<FileSystemDirectoryHandle> => {
    if (!("showDirectoryPicker" in window)) {
      throw new Error(
        "Your browser does not support local folder sync. Please use Chrome, Edge, or the Budget-It desktop app.",
      );
    }
    // @ts-expect-error - showDirectoryPicker is not yet in all TS definitions
    return await window.showDirectoryPicker({
      mode: "readwrite",
    });
  };

export const verifyWebPermission = async (
  handle: FileSystemDirectoryHandle,
  withPrompt = true,
): Promise<boolean> => {
  const options = { mode: "readwrite" as const };
  // @ts-expect-error - queryPermission type
  if ((await handle.queryPermission(options)) === "granted") {
    return true;
  }
  if (withPrompt) {
    // @ts-expect-error - requestPermission type
    if ((await handle.requestPermission(options)) === "granted") {
      return true;
    }
  }
  return false;
};

export const readWebFile = async (
  handle: FileSystemDirectoryHandle,
  filename: string,
): Promise<string> => {
  const fileHandle = await handle.getFileHandle(filename, { create: false });
  const file = await fileHandle.getFile();
  return await file.text();
};

export const writeWebFile = async (
  handle: FileSystemDirectoryHandle,
  filename: string,
  content: string,
): Promise<void> => {
  const fileHandle = await handle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
};
