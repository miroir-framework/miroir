/**
 * Category-generic access evaluation for #262.
 * Callers name a (targetType, targetUuid); the evaluator does not mention Application.
 */

export type AccessTarget = {
  targetType: string;
  targetUuid: string;
};

export type AccessGrant = {
  miroirUser: string;
  targetType: string;
  targetUuid: string;
};

export type AccessDeniedBody = {
  status: "error";
  errorType: "AccessDenied";
};

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; status: 403; body: AccessDeniedBody };

export const ACCESS_DENIED: AccessDeniedBody = {
  status: "error",
  errorType: "AccessDenied",
};

export const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
export const MIROIR_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
export const LIBRARY_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
export const DESIGNER_APPLICATION_UUID = "880831db-4f76-40b1-97c0-6a2f3f4ffccb";

export const ALWAYS_ALLOW_APPLICATION_TARGETS: AccessTarget[] = [
  { targetType: "application", targetUuid: ADMIN_APPLICATION_UUID },
  { targetType: "application", targetUuid: MIROIR_APPLICATION_UUID },
];

export const ENTITY_MIROIR_RIGHT_UUID = "a6136fc7-949b-4d64-9f13-dd3afce1ab3c";
export const ENTITY_ADMIN_APPLICATION_UUID = "25d935e7-9e93-42c2-aade-0472b883492b";
export const ENTITY_DEPLOYMENT_UUID = "7959d814-400c-4e80-988f-a00fe582ab98";

function normalizeInstanceList(value: unknown): Record<string, unknown>[] {
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

function targetsEqual(left: AccessTarget, right: AccessTarget): boolean {
  return left.targetType === right.targetType && left.targetUuid === right.targetUuid;
}

export function accessGrantsFromInstances(value: unknown): AccessGrant[] {
  return normalizeInstanceList(value)
    .map((row) => ({
      miroirUser: String(row.miroirUser ?? ""),
      targetType: String(row.targetType ?? ""),
      targetUuid: String(row.targetUuid ?? ""),
    }))
    .filter((grant) => grant.miroirUser && grant.targetType && grant.targetUuid);
}

export function hasAccess(args: {
  principal: { miroirUserUuid: string } | undefined;
  target: AccessTarget;
  grants: AccessGrant[];
  alwaysAllow: AccessTarget[];
}): boolean {
  if (!args.principal) {
    return false;
  }
  if (args.alwaysAllow.some((allowed) => targetsEqual(allowed, args.target))) {
    return true;
  }
  return args.grants.some(
    (grant) =>
      grant.miroirUser === args.principal!.miroirUserUuid &&
      grant.targetType === args.target.targetType &&
      grant.targetUuid === args.target.targetUuid,
  );
}

export function assertAccess(args: {
  principal: { miroirUserUuid: string } | undefined;
  target: AccessTarget;
  grants: AccessGrant[];
  alwaysAllow: AccessTarget[];
}): AccessDecision {
  if (hasAccess(args)) {
    return { allowed: true };
  }
  return { allowed: false, status: 403, body: ACCESS_DENIED };
}

export type AccessDeployment = {
  uuid: string;
  selfApplication: string;
};

export type AccessDirectory = {
  grants: AccessGrant[];
  deployments: AccessDeployment[];
};

export function deploymentsFromInstances(value: unknown): AccessDeployment[] {
  return normalizeInstanceList(value)
    .map((row) => ({
      uuid: String(row.uuid ?? ""),
      selfApplication: String(row.selfApplication ?? ""),
    }))
    .filter((row) => row.uuid && row.selfApplication);
}

export function applicationTargetForDeployment(
  deploymentUuid: string | undefined,
  deployments: AccessDeployment[],
): AccessTarget | undefined {
  if (!deploymentUuid) {
    return undefined;
  }
  const found = deployments.find((row) => row.uuid === deploymentUuid);
  if (!found) {
    return undefined;
  }
  return { targetType: "application", targetUuid: found.selfApplication };
}

export function assertAccessForDeployment(args: {
  enabled: boolean;
  principal: { miroirUserUuid: string } | undefined;
  deploymentUuid: string | undefined;
  grants: AccessGrant[];
  deployments: AccessDeployment[];
  alwaysAllow: AccessTarget[];
}): AccessDecision {
  if (!args.enabled) {
    return { allowed: true };
  }
  const target = applicationTargetForDeployment(args.deploymentUuid, args.deployments);
  if (!target) {
    return { allowed: false, status: 403, body: ACCESS_DENIED };
  }
  return assertAccess({
    principal: args.principal,
    target,
    grants: args.grants,
    alwaysAllow: args.alwaysAllow,
  });
}
