/**
 * #263: reads the Admin identity and access directory (users, credentials, rights, deployments)
 * through a DomainController. Shared by miroir-server, the CLI and Electron (moved from server.ts).
 * Run it on a DomainController that is not itself behind the authentication gate (the server's).
 */

import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  ADMIN_APPLICATION_UUID,
  ENTITY_DEPLOYMENT_UUID,
  ENTITY_MIROIR_RIGHT_UUID,
  accessGrantsFromInstances,
  deploymentsFromInstances,
} from "../1_core/authentication/AccessPolicy.js";
import type { AccessDirectoryLoader, LoadedAccessDirectory } from "../1_core/authentication/AccessGate.js";
import {
  AUTH_CHANGE_PASSWORD_ACTION_LABEL,
  ENTITY_MIROIR_USER_CREDENTIAL_UUID,
  ENTITY_MIROIR_USER_UUID,
  findCredentialInstance,
  identityDirectoryFromInstances,
  type AuthPrincipal,
} from "../1_core/authentication/AuthenticationPolicy.js";
import { defaultMetaModelEnvironment } from "../1_core/Model";

/** Query endpoint (runBoxedQueryAction). */
const QUERY_ENDPOINT_UUID = "9e404b3c-368c-40cb-be8b-e3c28550c25e";

export async function loadAccessDirectory(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<({ ok: true } & LoadedAccessDirectory) | { ok: false; errorMessage: string }> {
  const identityQuery = await domainController.handleBoxedExtractorOrQueryAction(
    {
      actionType: "runBoxedQueryAction",
      endpoint: QUERY_ENDPOINT_UUID,
      payload: {
        application: ADMIN_APPLICATION_UUID,
        applicationSection: "data",
        queryExecutionStrategy: "storage",
        query: {
          application: ADMIN_APPLICATION_UUID,
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          extractors: {
            users: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_MIROIR_USER_UUID,
            },
            credentials: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID,
            },
            rights: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_MIROIR_RIGHT_UUID,
            },
            deployments: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_DEPLOYMENT_UUID,
            },
          },
        },
      },
    } as any,
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  if (identityQuery instanceof Action2Error) {
    return {
      ok: false,
      errorMessage: identityQuery.errorMessage ?? "Authentication directory query failed",
    };
  }
  const returned = (identityQuery as { returnedDomainElement?: Record<string, unknown> }).returnedDomainElement;
  return {
    ok: true,
    directory: identityDirectoryFromInstances(returned?.users, returned?.credentials),
    credentialsValue: returned?.credentials,
    grants: accessGrantsFromInstances(returned?.rights),
    deployments: deploymentsFromInstances(returned?.deployments),
  };
}

/** The loader an AuthenticationGate needs: undefined when the directory cannot be read. */
export function accessDirectoryLoader(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap | (() => ApplicationDeploymentMap),
): AccessDirectoryLoader {
  return async () => {
    const map =
      typeof applicationDeploymentMap === "function" ? applicationDeploymentMap() : applicationDeploymentMap;
    const loaded = await loadAccessDirectory(domainController, map);
    if (!loaded.ok) {
      return undefined;
    }
    const { ok: _ok, ...directory } = loaded;
    return directory;
  };
}

/** Instance endpoint (updateInstance). */
const INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";

/**
 * #71 / #263: writes the principal's new password hash on its MiroirUserCredential row, through the
 * labeled `auth.change-password` update (the only credential mutation allowed). False when the row
 * is missing or the update fails.
 */
export async function persistPasswordChange(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  args: { principal: AuthPrincipal; credentialsValue: unknown; passwordHash: string },
): Promise<boolean> {
  const existing = findCredentialInstance(args.credentialsValue, args.principal.miroirUserUuid);
  if (!existing) {
    return false;
  }
  const result = await domainController.handleAction(
    {
      actionType: "updateInstance",
      actionLabel: AUTH_CHANGE_PASSWORD_ACTION_LABEL,
      endpoint: INSTANCE_ENDPOINT_UUID,
      payload: {
        application: ADMIN_APPLICATION_UUID,
        applicationSection: "data",
        parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID,
        objects: [{ ...existing, passwordHash: args.passwordHash } as any],
      },
    } as any,
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
    undefined,
    undefined,
    args.principal,
  );
  return !(result instanceof Action2Error) && (result as { status?: string })?.status !== "error";
}
