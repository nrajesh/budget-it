/**
 * Crypto utilities for encrypting and decrypting data using the Web Crypto API.
 * Uses AES-GCM with PBKDF2 for key derivation.
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // Standard for GCM
const ENC_ALGO = "AES-GCM";
const HASH_ALGO = "SHA-256";

/**
 * Encrypts a string using a password.
 * Returns a JSON string containing the cyphertext, salt, and iv.
 */
export async function encryptData(
  data: string,
  password: string,
): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(
    new Uint8Array(SALT_LENGTH),
  ) as any;
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH)) as any;
  const passwordKey = await importPassword(password);

  const key = await deriveKey(passwordKey, salt, ["encrypt"]);
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: ENC_ALGO,
      iv: iv,
    },
    key,
    enc.encode(data),
  );

  const encryptedPackage = {
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encryptedContent)),
  };

  return JSON.stringify(encryptedPackage);
}

/**
 * Decrypts a string using a password.
 * Expects the input to be the JSON format produced by encryptData.
 */
export async function decryptData(
  packageStr: string,
  password: string,
): Promise<string> {
  try {
    const pkg = JSON.parse(packageStr);
    const salt = fromBase64(pkg.salt);
    const iv = fromBase64(pkg.iv);
    const ciphertext = fromBase64(pkg.ciphertext);

    const passwordKey = await importPassword(password);
    const key = await deriveKey(passwordKey, salt, ["decrypt"]);

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: ENC_ALGO,
        iv: iv as any,
      },
      key,
      ciphertext as any,
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch (e) {
    console.error("Decryption failed:", e);
    throw new Error("Invalid password or corrupted file.");
  }
}

async function importPassword(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
}

async function deriveKey(
  passwordKey: CryptoKey,
  salt: Uint8Array,
  keyUsage: ["encrypt"] | ["decrypt"],
): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    passwordKey,
    { name: ENC_ALGO, length: 256 },
    false,
    keyUsage,
  );
}

// Helpers
function toBase64(buffer: Uint8Array): string {
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return window.btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}
