/**
 * Process-agnostic /auth/* dispatch used by RestClientStub and tests.
 * Express adapters in miroir-server call the same policy functions directly.
 */

import {
  buildAuthStatusBody,
  extractPrincipalFromAuthorizationHeader,
  getProcessTokenSecret,
  loginWithPassword,
  persistChangedPasswordHash,
  resolveAuthenticationEnabled,
  type IdentityDirectory,
} from "./AuthenticationPolicy.js";

export type AuthHttpResult = {
  status: number;
  data: unknown;
  directory?: IdentityDirectory;
};

function pathWithoutQuery(url: string): string {
  return (url.split("?")[0] ?? url).replace(/\/+$/, "") || "/";
}

function isAuthPath(path: string, suffix: string): boolean {
  return path === suffix || path.endsWith(suffix);
}

export async function handleAuthHttpRoute(args: {
  url: string;
  endpoint?: string;
  body?: unknown;
  authorizationHeader?: string;
  directory?: IdentityDirectory;
  env?: Record<string, string | undefined>;
}): Promise<AuthHttpResult | undefined> {
  const path = pathWithoutQuery(args.url);
  const endpointPath = args.endpoint ? pathWithoutQuery(args.endpoint) : path;
  const body = args.body && typeof args.body === "object" ? (args.body as Record<string, unknown>) : {};

  if (isAuthPath(path, "/auth/status") || isAuthPath(endpointPath, "/auth/status")) {
    return {
      status: 200,
      data: buildAuthStatusBody(resolveAuthenticationEnabled({ env: args.env ?? process.env })),
    };
  }

  if (isAuthPath(path, "/auth/login") || isAuthPath(endpointPath, "/auth/login")) {
    if (!args.directory) {
      return { status: 500, data: { status: "error", errorType: "AuthenticationDirectoryMissing" } };
    }
    const result = await loginWithPassword(
      {
        username: String(body.username ?? ""),
        password: String(body.password ?? ""),
      },
      args.directory,
      getProcessTokenSecret(args.env ?? process.env),
    );
    if (!result.ok) {
      return { status: result.status, data: result.body };
    }
    return { status: 200, data: { token: result.token, principal: result.principal } };
  }

  if (isAuthPath(path, "/auth/change-password") || isAuthPath(endpointPath, "/auth/change-password")) {
    const principal = await extractPrincipalFromAuthorizationHeader(
      args.authorizationHeader,
      getProcessTokenSecret(args.env ?? process.env),
    );
    if (!principal) {
      return { status: 401, data: { status: "error", errorType: "AuthenticationRequired" } };
    }
    if (!args.directory) {
      return { status: 500, data: { status: "error", errorType: "AuthenticationDirectoryMissing" } };
    }
    const result = await persistChangedPasswordHash({
      directory: args.directory,
      principal,
      currentPassword: String(body.currentPassword ?? ""),
      newPassword: String(body.newPassword ?? ""),
    });
    if (!result.ok) {
      return { status: result.status, data: result.body };
    }
    return { status: 200, data: { changed: true }, directory: result.directory };
  }

  return undefined;
}
