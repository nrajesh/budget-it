import { DataProvider } from "@/types/dataProvider";
import { decryptData } from "./crypto";

/**
 * Save content to a file, using File System Access API if available,
 * falling back to legacy download.
 */
export const saveFile = async (
  filename: string,
  content: string,
  description: string,
): Promise<boolean> => {
  try {
    // Try File System Access API first (Chrome/Edge/Desktop)
    // @ts-expect-error - showSaveFilePicker is not yet in all TS definitions
    if (window.showSaveFilePicker) {
      // @ts-expect-error - showSaveFilePicker types
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: description,
            accept: {
              "application/json": [".json", ".lock"],
              "text/csv": [".csv"],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    }
    throw new Error("File System Access API not supported");
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Save cancelled by user");
    }

    // Fallback to classic download
    const element = document.createElement("a");

    // Use application/octet-stream to force download in stubborn browsers (like Safari)
    // instead of opening the JSON in a tab.
    const mimeType = filename.endsWith(".csv")
      ? "text/csv;charset=utf-8"
      : "application/octet-stream";

    const BOM = filename.endsWith(".csv") ? "\uFEFF" : "";
    const file = new Blob([BOM + content], { type: mimeType });
    const url = URL.createObjectURL(file);

    element.href = url;
    element.download = filename;
    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    // Cleanup with a small delay to ensure the click is registered
    setTimeout(() => {
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    }, 100);

    return false; // Indicates fallback was used
  }
};

/**
 * Generate a full backup object (all ledgers)
 */
export const generateBackupData = async (dataProvider: DataProvider) => {
  return await dataProvider.exportData();
};

/**
 * Process import of a backup file string.
 * Detects encryption and returns necessary next steps or success.
 */
export type ImportResult =
  | { type: "success" }
  | { type: "encrypted"; content: string }
  | { type: "error"; message: string };

export const processImport = async (
  content: string,
  dataProvider: DataProvider,
): Promise<ImportResult> => {
  try {
    const parsed = JSON.parse(content);
    if (parsed.ciphertext && parsed.iv && parsed.salt) {
      return { type: "encrypted", content: content };
    } else {
      await dataProvider.importData(parsed);
      return { type: "success" };
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Invalid file format";
    return { type: "error", message };
  }
};

/**
 * Decrypt and import data
 */
export const processEncryptedImport = async (
  content: string,
  password: string,
  dataProvider: DataProvider,
): Promise<ImportResult> => {
  try {
    const decryptedParams = await decryptData(content, password);
    const data = JSON.parse(decryptedParams);
    await dataProvider.importData(data);
    return { type: "success" };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Decryption failed";
    return { type: "error", message };
  }
};
