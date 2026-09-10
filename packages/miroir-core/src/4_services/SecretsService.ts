/**
 * Wrapping-key hold, AES-256-GCM encrypt/decrypt, and hydrate of Admin MiroirSecret rows.
 * Issue #270 Slice 1 — no import upsert (that is Slice 6).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { registerHydratedProcessSecret } from "./SecretStore.js";

const AES_256_GCM = "aes-256-gcm";
const GCM_IV_LENGTH = 12;

let secretsMasterKey: string | undefined;

export function setSecretsMasterKey(key: string): void {
  secretsMasterKey = key;
}

export function getSecretsMasterKey(): string | undefined {
  return secretsMasterKey;
}

export function clearSecretsMasterKey(): void {
  secretsMasterKey = undefined;
}

function wrappingKeyBytes(wrappingKey: string): Buffer {
  return createHash("sha256").update(wrappingKey, "utf8").digest();
}

export function encryptSecret(algorithm: string, wrappingKey: string, plaintext: string): string {
  if (algorithm !== AES_256_GCM) {
    throw new Error("Unsupported secret algorithm");
  }
  if (!wrappingKey) {
    throw new Error("Wrapping key is required");
  }
  const iv = randomBytes(GCM_IV_LENGTH);
  const cipher = createCipheriv(AES_256_GCM, wrappingKeyBytes(wrappingKey), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    AES_256_GCM,
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    tag.toString("base64url"),
  ].join("$");
}

export function decryptSecret(algorithm: string, wrappingKey: string, ciphertext: string): string {
  if (algorithm !== AES_256_GCM) {
    throw new Error("Unsupported secret algorithm");
  }
  if (!wrappingKey) {
    throw new Error("Wrapping key is required");
  }
  const parts = ciphertext.split("$");
  if (parts.length !== 4 || parts[0] !== AES_256_GCM) {
    throw new Error("Invalid secret ciphertext");
  }
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const data = Buffer.from(parts[2], "base64url");
    const tag = Buffer.from(parts[3], "base64url");
    const decipher = createDecipheriv(AES_256_GCM, wrappingKeyBytes(wrappingKey), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Failed to decrypt secret");
  }
}

function normalizeSecretRows(rows: unknown): Record<string, unknown>[] {
  if (Array.isArray(rows)) {
    return rows.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
  }
  if (rows && typeof rows === "object") {
    return Object.values(rows as Record<string, unknown>).filter(
      (row): row is Record<string, unknown> => !!row && typeof row === "object",
    );
  }
  return [];
}

export function hydrateSecrets(params: { wrappingKey?: string; rows: unknown }): void {
  const rows = normalizeSecretRows(params.rows);
  if (rows.length > 0 && !params.wrappingKey) {
    throw new Error("MiroirSecret rows exist but no wrapping key was provided");
  }
  if (!params.wrappingKey) {
    return;
  }
  for (const row of rows) {
    const name = typeof row.name === "string" ? row.name : "";
    const ciphertext = typeof row.ciphertext === "string" ? row.ciphertext : "";
    if (!name || !ciphertext) {
      throw new Error("Invalid MiroirSecret row");
    }
    if (typeof row.miroirUser === "string" && row.miroirUser) {
      continue;
    }
    const algorithm =
      typeof row.algorithm === "string" && row.algorithm ? row.algorithm : AES_256_GCM;
    const value = decryptSecret(algorithm, params.wrappingKey, ciphertext);
    registerHydratedProcessSecret(name, value);
  }
}
