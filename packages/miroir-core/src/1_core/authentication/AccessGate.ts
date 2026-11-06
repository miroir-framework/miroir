/**
 * #263: the identity and access steps every door runs (REST, MCP, CLI, Electron IPC), on top of
 * the #71 / #262 / #264 policy functions. Hosts supply the hatch value and a loader that reads the
 * Admin directory for each request, so a deactivated user or a new grant is seen at once.
 */

import { GIT_ACTION_TYPES } from "../../0_interfaces/3_controllers/GitAction.js";
import {
  ACCESS_DENIED,
  ALWAYS_ALLOW_APPLICATION_TARGETS,
  assertAccessForDeployment,
  isDesignerToolsVisible,
  type AccessDecision,
  type AccessDeployment,
  type AccessGrant,
} from "./AccessPolicy.js";
import {
  assertRequestAllowed,
  bindPrincipalToDirectory,
  extractPrincipalFromAuthorizationHeader,
  getProcessTokenSecret,
  type AuthenticationRequiredBody,
  type AuthPrincipal,
  type IdentityDirectory,
} from "./AuthenticationPolicy.js";

export type LoadedAccessDirectory = {
  directory: IdentityDirectory;
  /** The raw MiroirUserCredential rows, for the password change. */
  credentialsValue?: unknown;
  grants: AccessGrant[];
  deployments: AccessDeployment[];
};

/** Reads the Admin directory; undefined when it cannot be read (every request is then refused). */
export type AccessDirectoryLoader = () => Promise<LoadedAccessDirectory | undefined>;

/**
 * What the server needs to authenticate requests: whether it is on, and how to read the access directory.
 * @public
 */
export type AuthenticationGate = {
  enabled: boolean;
  loadDirectory: AccessDirectoryLoader;
  /** Defaults to getProcessTokenSecret(). */
  secret?: string;
  /**
   * Writes a changed password hash (POST /auth/change-password through RestClientStub). Without
   * it, the stub only updates its in-memory directory (test seam).
   */
  persistPasswordChange?: (args: {
    principal: AuthPrincipal;
    credentialsValue: unknown;
    passwordHash: string;
  }) => Promise<boolean>;
};

export type AuthenticatedRequest =
  | { allowed: true; principal: AuthPrincipal | undefined; access: LoadedAccessDirectory | undefined }
  | { allowed: false; status: 401; body: AuthenticationRequiredBody };

/**
 * Hatch off: allowed, no principal. Hatch on: the Bearer must verify and bind to an active user of
 * the current directory, else 401 AuthenticationRequired.
 */
export async function authenticateRequest(
  gate: AuthenticationGate,
  authorizationHeader: string | undefined,
): Promise<AuthenticatedRequest> {
  if (!gate.enabled) {
    return { allowed: true, principal: undefined, access: undefined };
  }
  const extracted = await extractPrincipalFromAuthorizationHeader(
    authorizationHeader,
    gate.secret ?? getProcessTokenSecret(),
  );
  const access = extracted ? await gate.loadDirectory() : undefined;
  const principal = extracted && access ? bindPrincipalToDirectory(extracted, access.directory) : undefined;
  const allowed = assertRequestAllowed({ enabled: true, principal });
  if (!allowed.allowed) {
    return allowed;
  }
  return { allowed: true, principal, access };
}

/** Application or deployment grant (#262, #264), Admin and Miroir always allowed. */
export function authorizeDeployment(
  enabled: boolean,
  authenticated: { principal: AuthPrincipal | undefined; access: LoadedAccessDirectory | undefined },
  deploymentUuids: string | undefined | string[],
): AccessDecision {
  // A list must be allowed as a whole; an empty one is checked as "no deployment" (denied when on).
  const targets = Array.isArray(deploymentUuids)
    ? deploymentUuids.length > 0 ? deploymentUuids : [undefined]
    : [deploymentUuids];
  let decision: AccessDecision | undefined;
  for (const deploymentUuid of targets) {
    decision = assertAccessForDeployment({
      enabled,
      principal: authenticated.principal,
      deploymentUuid,
      grants: authenticated.access?.grants ?? [],
      deployments: authenticated.access?.deployments ?? [],
      alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
    });
    if (!decision.allowed) {
      return decision;
    }
  }
  return decision!;
}

/** Actions only a designer runs (#679 D13): a grant on the application is not enough. */
const DESIGNER_ONLY_ACTION_TYPES: readonly string[] = GIT_ACTION_TYPES;

/**
 * #679 D13: with authentication on, a designer-only action (the Git actions) needs what the designer
 * tools need, a grant on Admin; Admin and Miroir being always allowed does not count here.
 */
export function authorizeDesignerOnlyAction(
  enabled: boolean,
  authenticated: { principal: AuthPrincipal | undefined; access: LoadedAccessDirectory | undefined },
  body: unknown,
): AccessDecision {
  const container = body as { action?: { actionType?: unknown }; actionType?: unknown } | undefined;
  const actionType = container?.action?.actionType ?? container?.actionType;
  if (!enabled || typeof actionType !== "string" || !DESIGNER_ONLY_ACTION_TYPES.includes(actionType)) {
    return { allowed: true };
  }
  const designer = isDesignerToolsVisible({
    designerTools: true,
    authEnabled: true,
    principal: authenticated.principal,
    grants: authenticated.access?.grants ?? [],
  });
  return designer ? { allowed: true } : { allowed: false, status: 403, body: ACCESS_DENIED };
}
