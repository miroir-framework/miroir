import {
  DESIGNER_APPLICATION_UUID,
  LIBRARY_APPLICATION_UUID,
  hasAccess,
  type AccessDeployment,
  type AccessGrant,
  type AccessTarget,
} from "./AccessPolicy.js";

export function nextPageWhenAuthGate(args: {
  enabled: boolean;
  hasToken: boolean;
  intended: string;
}): string {
  if (!args.enabled || args.hasToken) {
    return args.intended || "/?page=home";
  }
  const intended = args.intended || "/?page=home";
  return `/?page=login&return=${encodeURIComponent(intended)}`;
}

export function applicationIsReachable(args: {
  principal: { miroirUserUuid: string } | undefined;
  applicationUuid: string;
  grants: AccessGrant[];
  deployments?: AccessDeployment[];
  alwaysAllow?: AccessTarget[];
}): boolean {
  if (
    hasAccess({
      principal: args.principal,
      target: { targetType: "application", targetUuid: args.applicationUuid },
      grants: args.grants,
      alwaysAllow: args.alwaysAllow ?? [],
    })
  ) {
    return true;
  }
  return (args.deployments ?? []).some(
    (deployment) =>
      deployment.selfApplication === args.applicationUuid &&
      hasAccess({
        principal: args.principal,
        target: { targetType: "deployment", targetUuid: deployment.uuid },
        grants: args.grants,
        alwaysAllow: args.alwaysAllow ?? [],
      }),
  );
}

export function visibleUserApplications(args: {
  enabled: boolean;
  principal: { miroirUserUuid: string } | undefined;
  grants: AccessGrant[];
  candidates?: string[];
  deployments?: AccessDeployment[];
}): string[] {
  const candidates = args.candidates ?? [LIBRARY_APPLICATION_UUID, DESIGNER_APPLICATION_UUID];
  if (!args.enabled) {
    return [...candidates];
  }
  return candidates.filter((targetUuid) =>
    applicationIsReachable({
      principal: args.principal,
      applicationUuid: targetUuid,
      grants: args.grants,
      deployments: args.deployments,
      alwaysAllow: [],
    }),
  );
}

export function nextPageWhenAccessDenied(args: {
  enabled: boolean;
  hasAccess: boolean;
  intended: string;
}): string {
  if (!args.enabled || args.hasAccess) {
    return args.intended || "/?page=home";
  }
  return "/?page=home";
}

export function authorizationHeaders(token: string | undefined): Record<string, string> {
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
