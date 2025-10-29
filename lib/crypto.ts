import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

import { env } from "./env";

const KEY = Buffer.from(env.GARMIN_TOKEN_ENCRYPTION_KEY, "base64");

if (KEY.length !== 32) {
  throw new Error("Invalid GARMIN_TOKEN_ENCRYPTION_KEY: expected 32 bytes once decoded from base64");
}

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export class EncryptionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "EncryptionError";
  }
}

export const encryptSecret = (plainText: string): string => {
  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv("aes-256-gcm", KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, encrypted, authTag]).toString("base64url");
  } catch (error) {
    throw new EncryptionError("Unable to encrypt secret", error);
  }
};

export const decryptSecret = (payload: string): string => {
  try {
    const buffer = Buffer.from(payload, "base64url");
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(buffer.length - AUTH_TAG_LENGTH);
    const ciphertext = buffer.subarray(IV_LENGTH, buffer.length - AUTH_TAG_LENGTH);

    const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    throw new EncryptionError("Unable to decrypt secret", error);
  }
};
