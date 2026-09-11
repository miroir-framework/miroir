/**
 * Process-agnostic GET/POST/DELETE /secrets used by RestClientStub and Express.
 * Persist goes through serverDomainController + secrets.set / secrets.delete.
 */

import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement.js";
import type { EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { ApplicationDeploymentMap } from "../1_core/Deployment.js";
import { defaultSelfApplicationDeploymentMap } from "../1_core/Deployment.js";
import { defaultMetaModelEnvironment } from "../1_core/Model.js";
import {
  ENTITY_MIROIR_SECRET_UUID,
  SECRETS_DELETE_ACTION_LABEL,
  SECRETS_SET_ACTION_LABEL,
  type AuthPrincipal,
} from "../1_core/authentication/AuthenticationPolicy.js";
import {
  encryptSecret,
  getSecretsMasterKey,
  miroirSecretInstanceUuid,
  withSecretRowWriteLock,
} from "./SecretsService.js";

const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";

export type SecretsHttpResult = {
  status: number;
  data: unknown;
};

function pathWithoutQuery(url: string): string {
  return (url.split("?")[0] ?? url).replace(/\/+$/, "") || "/";
}

function isSecretsPath(path: string): boolean {
  return path === "/secrets" || path.endsWith("/secrets");
}

function normalizeMethod(method: string): string {
  return method.toLowerCase();
}

function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

function normalizeSecretRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).filter(
      (row): row is Record<string, unknown> => !!row && typeof row === "object",
    );
  }
  return [];
}

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

async function querySecretRows(
  serverDomainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Record<string, unknown>[] | SecretsHttpResult> {
  const queryResult = await serverDomainController.handleBoxedExtractorOrQueryAction(
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
    return {
      status: 500,
      data: {
        status: "error",
        errorType: "FailedToHandleAction",
        errorMessage: queryResult.errorMessage,
      },
    };
  }
  return normalizeSecretRows(
    (queryResult as { returnedDomainElement?: { secrets?: unknown } }).returnedDomainElement
      ?.secrets,
  );
}

export async function handleSecretsHttpRoute(args: {
  url: string;
  endpoint?: string;
  method: string;
  body?: unknown;
  principal?: AuthPrincipal;
  serverDomainController: DomainControllerInterface;
  applicationDeploymentMap?: ApplicationDeploymentMap;
}): Promise<SecretsHttpResult | undefined> {
  const path = pathWithoutQuery(args.url);
  const endpointPath = args.endpoint ? pathWithoutQuery(args.endpoint) : path;
  if (!isSecretsPath(path) && !isSecretsPath(endpointPath)) {
    return undefined;
  }

  const method = normalizeMethod(args.method);
  if (method !== "get" && method !== "post" && method !== "delete") {
    return { status: 405, data: { status: "error", errorType: "MethodNotAllowed" } };
  }
  if (!args.principal) {
    return { status: 401, data: { status: "error", errorType: "AuthenticationRequired" } };
  }

  const applicationDeploymentMap =
    args.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  const body = asRecord(args.body);

  if (method === "get") {
    const rows = await querySecretRows(args.serverDomainController, applicationDeploymentMap);
    if (!Array.isArray(rows)) {
      return rows;
    }
    const secrets = rows
      .filter((row) => {
        const scope = rowScope(row);
        return (
          scope === "process" || String(row.miroirUser ?? "") === args.principal!.miroirUserUuid
        );
      })
      .map((row) => {
        const scope = rowScope(row);
        const listed: { name: string; scope: "process" | "user"; miroirUser?: string } = {
          name: String(row.name ?? ""),
          scope,
        };
        if (scope === "user") {
          listed.miroirUser = String(row.miroirUser);
        }
        return listed;
      });
    return { status: 200, data: { secrets } };
  }

  if (method === "post") {
    const name = String(body.name ?? "");
    const value = typeof body.value === "string" ? body.value : undefined;
    const scope = body.scope;
    if (!name || value === undefined || (scope !== "process" && scope !== "user")) {
      return { status: 400, data: { status: "error", errorType: "InvalidSecretRequest" } };
    }
    if (scope === "user") {
      if (typeof body.miroirUser === "string" && body.miroirUser !== args.principal.miroirUserUuid) {
        return { status: 403, data: { status: "error", errorType: "Forbidden" } };
      }
    }
    const wrappingKey = getSecretsMasterKey();
    if (!wrappingKey) {
      return { status: 500, data: { status: "error", errorType: "SecretsMasterKeyMissing" } };
    }
    const miroirUser = scope === "user" ? args.principal.miroirUserUuid : undefined;
    return withSecretRowWriteLock(async () => {
      const rows = await querySecretRows(args.serverDomainController, applicationDeploymentMap);
      if (!Array.isArray(rows)) {
        return rows;
      }
      const existing = rows.find((row) => rowMatches(row, name, scope, miroirUser));
      const ciphertext = encryptSecret("aes-256-gcm", wrappingKey, value);
      const instance = {
        ...(existing ?? {}),
        uuid: existing?.uuid
          ? String(existing.uuid)
          : miroirSecretInstanceUuid(name, scope, miroirUser),
        parentName: "MiroirSecret",
        parentUuid: ENTITY_MIROIR_SECRET_UUID,
        name,
        ciphertext,
        algorithm: "aes-256-gcm",
        ...(miroirUser ? { miroirUser } : {}),
      } as unknown as EntityInstance;
      if (!miroirUser) {
        delete (instance as { miroirUser?: string }).miroirUser;
      }
      const persistResult = await args.serverDomainController.handleAction(
        {
          actionType: existing ? "updateInstance" : "createInstance",
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
        args.principal,
      );
      if (persistResult instanceof Action2Error) {
        return {
          status: 500,
          data: {
            status: "error",
            errorType: "FailedToHandleAction",
            errorMessage: persistResult.errorMessage,
          },
        };
      }
      return { status: 200, data: { set: true } };
    });
  }

  const name = String(body.name ?? "");
  const scope = body.scope;
  if (!name || (scope !== "process" && scope !== "user")) {
    return { status: 400, data: { status: "error", errorType: "InvalidSecretRequest" } };
  }
  if (scope === "user") {
    if (typeof body.miroirUser === "string" && body.miroirUser !== args.principal.miroirUserUuid) {
      return { status: 403, data: { status: "error", errorType: "Forbidden" } };
    }
  }
  const miroirUser = scope === "user" ? args.principal.miroirUserUuid : undefined;
  const rows = await querySecretRows(args.serverDomainController, applicationDeploymentMap);
  if (!Array.isArray(rows)) {
    return rows;
  }
  const existing = rows.find((row) => rowMatches(row, name, scope, miroirUser));
  if (!existing?.uuid) {
    return { status: 404, data: { status: "error", errorType: "SecretNotFound" } };
  }
  const persistResult = await args.serverDomainController.handleAction(
    {
      actionType: "deleteInstance",
      actionLabel: SECRETS_DELETE_ACTION_LABEL,
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: ADMIN_APPLICATION_UUID,
        applicationSection: "data",
        parentUuid: ENTITY_MIROIR_SECRET_UUID,
        objects: [
          {
            uuid: String(existing.uuid),
            parentUuid: ENTITY_MIROIR_SECRET_UUID,
          } as EntityInstance,
        ],
      },
    },
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
    undefined,
    undefined,
    args.principal,
  );
  if (persistResult instanceof Action2Error) {
    return {
      status: 500,
      data: {
        status: "error",
        errorType: "FailedToHandleAction",
        errorMessage: persistResult.errorMessage,
      },
    };
  }
  return { status: 200, data: { deleted: true } };
}
