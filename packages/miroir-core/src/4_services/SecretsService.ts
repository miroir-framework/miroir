/**
 * Wrapping-key hold, AES-256-GCM encrypt/decrypt, and hydrate of Admin MiroirSecret rows.
 * Issue #270 Slice 1 — no import upsert (that is Slice 6).
 * Slice 5 adds persistRotatedSecretRow (DC passed in; this module does not import DomainController).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import type { EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement.js";
import type { ApplicationDeploymentMap } from "../1_core/Deployment.js";
import { defaultSelfApplicationDeploymentMap } from "../1_core/Deployment.js";
import { defaultMetaModelEnvironment } from "../1_core/Model.js";
import {
  ENTITY_MIROIR_SECRET_UUID,
  SECRETS_SET_ACTION_LABEL,
} from "../1_core/authentication/AuthenticationPolicy.js";
import { registerHydratedProcessSecret, registerHydratedUserSecret } from "./SecretStore.js";

const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";

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
    const algorithm =
      typeof row.algorithm === "string" && row.algorithm ? row.algorithm : AES_256_GCM;
    const value = decryptSecret(algorithm, params.wrappingKey, ciphertext);
    if (typeof row.miroirUser === "string" && row.miroirUser) {
      registerHydratedUserSecret(row.miroirUser, name, value);
      continue;
    }
    registerHydratedProcessSecret(name, value);
  }
}

export type PersistRotatedSecretRowArgs = {
  name: string;
  value: string;
  scope: "process" | "user";
  miroirUserUuid?: string;
};

function rowScope(row: Record<string, unknown>): "process" | "user" {
  return typeof row.miroirUser === "string" && row.miroirUser ? "user" : "process";
}

function rowMatches(
  row: Record<string, unknown>,
  name: string,
  scope: "process" | "user",
  miroirUserUuid?: string,
): boolean {
  if (String(row.name ?? "") !== name) {
    return false;
  }
  if (scope === "process") {
    return rowScope(row) === "process";
  }
  return rowScope(row) === "user" && String(row.miroirUser ?? "") === (miroirUserUuid ?? "");
}

async function querySecretRowsForPersist(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Record<string, unknown>[]> {
  const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
    {
      actionType: "runBoxedQueryAction",
      endpoint: QUERY_ENDPOINT,
      payload: {
        application: ADMIN_APPLICATION_UUID,
        applicationSection: "data",
        queryExecutionStrategy: "storage",
        query: {
          application: ADMIN_APPLICATION_UUID,
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          extractors: {
            secrets: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_MIROIR_SECRET_UUID,
            },
          },
        },
      },
    },
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  if (queryResult instanceof Action2Error) {
    throw new Error(queryResult.errorMessage ?? "Failed to query MiroirSecret rows");
  }
  return normalizeSecretRows(
    (queryResult as { returnedDomainElement?: { secrets?: unknown } }).returnedDomainElement
      ?.secrets,
  );
}

/**
 * Re-encrypt the matching MiroirSecret row and persist via `secrets.set`.
 * Fail-closed when the wrapping key is unset. Does not import DomainController.
 */
export async function persistRotatedSecretRow(
  domainController: DomainControllerInterface,
  args: PersistRotatedSecretRowArgs,
  applicationDeploymentMap: ApplicationDeploymentMap = defaultSelfApplicationDeploymentMap,
): Promise<void> {
  const wrappingKey = getSecretsMasterKey();
  if (!wrappingKey) {
    throw new Error("Wrapping key is required to persist a rotated secret");
  }
  const rows = await querySecretRowsForPersist(domainController, applicationDeploymentMap);
  const existing = rows.find((row) =>
    rowMatches(row, args.name, args.scope, args.miroirUserUuid),
  );
  if (!existing?.uuid) {
    throw new Error("No MiroirSecret row matches the rotated secret");
  }
  const ciphertext = encryptSecret("aes-256-gcm", wrappingKey, args.value);
  const miroirUser = args.scope === "user" ? args.miroirUserUuid : undefined;
  const instance = {
    ...existing,
    uuid: String(existing.uuid),
    parentName: "MiroirSecret",
    parentUuid: ENTITY_MIROIR_SECRET_UUID,
    name: args.name,
    ciphertext,
    algorithm: "aes-256-gcm",
    ...(miroirUser ? { miroirUser } : {}),
  } as unknown as EntityInstance;
  if (!miroirUser) {
    delete (instance as { miroirUser?: string }).miroirUser;
  }
  const persistResult = await domainController.handleAction(
    {
      actionType: "updateInstance",
      actionLabel: SECRETS_SET_ACTION_LABEL,
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: ADMIN_APPLICATION_UUID,
        applicationSection: "data",
        parentUuid: ENTITY_MIROIR_SECRET_UUID,
        objects: [instance],
      },
    },
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
    undefined,
    undefined,
    miroirUser ? { miroirUserUuid: miroirUser, username: "" } : undefined,
  );
  if (persistResult instanceof Action2Error) {
    throw new Error(persistResult.errorMessage ?? "Failed to persist rotated secret");
  }
  if (miroirUser) {
    registerHydratedUserSecret(miroirUser, args.name, args.value);
    return;
  }
  registerHydratedProcessSecret(args.name, args.value);
}
