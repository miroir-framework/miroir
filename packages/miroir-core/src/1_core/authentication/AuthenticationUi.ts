import {
  DESIGNER_APPLICATION_UUID,
  LIBRARY_APPLICATION_UUID,
  hasAccess,
  type AccessGrant,
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

export function visibleUserApplications(args: {
  enabled: boolean;
  principal: { miroirUserUuid: string } | undefined;
  grants: AccessGrant[];
  candidates?: string[];
}): string[] {
  const candidates = args.candidates ?? [LIBRARY_APPLICATION_UUID, DESIGNER_APPLICATION_UUID];
  if (!args.enabled) {
    return [...candidates];
  }
  return candidates.filter((targetUuid) =>
    hasAccess({
      principal: args.principal,
      target: { targetType: "application", targetUuid },
      grants: args.grants,
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
