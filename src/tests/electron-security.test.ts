import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import {
  loadAuthorizedFolders,
  saveAuthorizedFolders,
  isFolderAuthorized,
} from "../../electron/security";

const TEST_CONFIG_PATH = path.join(
  os.tmpdir(),
  `backup-config-${Date.now()}.json`,
);

describe("Electron Security Logic", () => {
  beforeEach(() => {
    // Ensure clean state
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH);
    }
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH);
    }
  });

  it("should save and load authorized folders correctly", () => {
    const folders = new Set<string>();
    folders.add(path.normalize("/test/path/1"));
    folders.add(path.normalize("/test/path/2"));

    saveAuthorizedFolders(TEST_CONFIG_PATH, folders);

    const loaded = loadAuthorizedFolders(TEST_CONFIG_PATH);
    expect(loaded.has(path.normalize("/test/path/1"))).toBe(true);
    expect(loaded.has(path.normalize("/test/path/2"))).toBe(true);
    expect(loaded.size).toBe(2);
  });

  it("should return empty set if config file does not exist", () => {
    const loaded = loadAuthorizedFolders(TEST_CONFIG_PATH);
    expect(loaded.size).toBe(0);
  });

  it("should validate authorized folders correctly", () => {
    const folders = new Set<string>();
    const authorizedPath = path.normalize("/authorized/path");
    folders.add(authorizedPath);

    expect(isFolderAuthorized(authorizedPath, folders)).toBe(true);
    expect(isFolderAuthorized("/unauthorized/path", folders)).toBe(false);
  });
});
