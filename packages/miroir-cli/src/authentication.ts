import {
  accessDirectoryLoader,
  authenticateRequest,
  getProcessTokenSecret,
  loginWithPassword,
  resolveAuthenticationEnabled,
  setRestClientAuthorizationTokenGetter,
  type AuthenticationGate,
  type AuthPrincipal,
} from "miroir-core";

import type { CliPlatform } from "./platform.js";

// ################################################################################################
// #263: with authentication on, the CLI runs commands as a platform user. The hatch is the
// server's (--disable-auth / --enable-auth, MIROIR_AUTH_ENABLED, server.authentication.enabled of
// the environment, default on). Identity: --token / MIROIR_AUTH_TOKEN (a token from a server that
// shares MIROIR_AUTH_TOKEN_SECRET), or --user with MIROIR_PASSWORD or a prompt.
// ################################################################################################

export type CliIdentityOptions = {
  token?: string;
  user?: string;
};

export type CliAuthenticationError = {
  status: "error";
  error: { type: "AuthenticationRequired" | "AuthenticationFailed"; message: string };
};

export type CliAuthentication =
  | { ok: true; enabled: boolean; principal?: AuthPrincipal }
  | ({ ok: false } & CliAuthenticationError);

function failure(type: CliAuthenticationError["error"]["type"], message: string): CliAuthentication {
  return { ok: false, status: "error", error: { type, message } };
}

/**
 * Installs the authentication gate on the CLI's emulated server and establishes the principal the
 * commands run as. With the hatch off, nothing is installed and no identity is needed.
 */
export async function authenticateCli(args: {
  platform: CliPlatform;
  argv: string[];
  env: Record<string, string | undefined>;
  options: CliIdentityOptions;
  /** Asks for the password of --user when MIROIR_PASSWORD is unset; undefined when it cannot. */
  readPassword: (username: string) => Promise<string | undefined>;
}): Promise<CliAuthentication> {
  const { platform, env, options } = args;
  const enabled = resolveAuthenticationEnabled({
    argv: args.argv,
    env,
    config: { enabled: platform.environment.environment.server?.authentication?.enabled },
  });
  if (!enabled) {
    platform.restClientStub?.setAuthenticationGate({ enabled, loadDirectory: async () => undefined });
    return { ok: true, enabled };
  }
  if (!platform.restClientStub || !platform.serverDomainController) {
    return failure("AuthenticationRequired", "authentication is on and this CLI has no emulated server to gate");
  }
  const gate: AuthenticationGate = {
    enabled,
    loadDirectory: accessDirectoryLoader(platform.serverDomainController, platform.applicationDeploymentMap),
  };
  platform.restClientStub.setAuthenticationGate(gate);
  setRestClientAuthorizationTokenGetter(() => undefined);

  let token = options.token ?? env.MIROIR_AUTH_TOKEN;
  if (options.user) {
    const password = env.MIROIR_PASSWORD ?? (await args.readPassword(options.user));
    if (password === undefined) {
      return failure("AuthenticationFailed", "no password: set MIROIR_PASSWORD or run in a terminal");
    }
    const access = await gate.loadDirectory();
    const login = access
      ? await loginWithPassword({ username: options.user, password }, access.directory, gate.secret ?? getProcessTokenSecret())
      : undefined;
    if (!login?.ok) {
      return failure("AuthenticationFailed", "authentication failed");
    }
    token = login.token;
  }
  if (!token) {
    return failure(
      "AuthenticationRequired",
      "authentication is on: pass --user <name> (password from MIROIR_PASSWORD or a prompt) or --token <bearer> (MIROIR_AUTH_TOKEN)",
    );
  }
  const authenticated = await authenticateRequest(gate, `Bearer ${token}`);
  if (!authenticated.allowed || !authenticated.principal) {
    return failure(
      "AuthenticationFailed",
      "authentication failed: the token is invalid or expired, or was issued with another MIROIR_AUTH_TOKEN_SECRET",
    );
  }
  const bearer = token;
  setRestClientAuthorizationTokenGetter(() => bearer);
  return { ok: true, enabled, principal: authenticated.principal };
}

/** Reads a password from the terminal without echoing it; undefined when stdin is not a TTY. */
export async function readPasswordFromTerminal(username: string): Promise<string | undefined> {
  const stdin = process.stdin;
  if (!stdin.isTTY) {
    return undefined;
  }
  process.stderr.write(`Password for ${username}: `);
  return new Promise((resolve) => {
    let password = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\n" || char === "\r" || char === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stderr.write("\n");
          resolve(password);
          return;
        }
        if (char === "\u0003") {
          stdin.setRawMode(false);
          process.exit(130);
        }
        if (char === "\u007f") {
          password = password.slice(0, -1);
        } else {
          password += char;
        }
      }
    };
    stdin.on("data", onData);
  });
}
