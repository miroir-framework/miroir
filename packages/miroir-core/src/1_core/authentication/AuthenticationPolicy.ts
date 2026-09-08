/**
 * Process-agnostic authentication policy for #71.
 * Express / RestClientStub / (later) MCP and Electron are adapters.
 */

export type AuthPrincipal = {
  miroirUserUuid: string;
  username: string;
};

export type AuthenticationEnabledInputs = {
  argv?: string[];
  env?: Record<string, string | undefined>;
  config?: { enabled?: boolean };
};

export type AuthStatusBody = {
  enabled: boolean;
};

export type AuthenticationRequiredBody = {
  status: "error";
  errorType: "AuthenticationRequired";
};

export type RequestAllowed =
  | { allowed: true }
  | { allowed: false; status: 401; body: AuthenticationRequiredBody };

const AUTHENTICATION_REQUIRED: AuthenticationRequiredBody = {
  status: "error",
  errorType: "AuthenticationRequired",
};

function parseEnabledFlag(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "0" || normalized === "false" || normalized === "off") {
    return false;
  }
  if (normalized === "1" || normalized === "true" || normalized === "on") {
    return true;
  }
  return undefined;
}

/**
 * Precedence: last CLI --enable-auth / --disable-auth, then MIROIR_AUTH_ENABLED, then
 * config.enabled, then default on.
 */
export function resolveAuthenticationEnabled(
  inputs: AuthenticationEnabledInputs = {},
): boolean {
  const argv = inputs.argv ?? [];
  let cliOverride: boolean | undefined;
  for (const arg of argv) {
    if (arg === "--disable-auth") {
      cliOverride = false;
    } else if (arg === "--enable-auth") {
      cliOverride = true;
    }
  }
  if (cliOverride !== undefined) {
    return cliOverride;
  }

  const envOverride = parseEnabledFlag(inputs.env?.MIROIR_AUTH_ENABLED);
  if (envOverride !== undefined) {
    return envOverride;
  }

  if (inputs.config?.enabled === false) {
    return false;
  }
  if (inputs.config?.enabled === true) {
    return true;
  }
  return true;
}

export function buildAuthStatusBody(enabled: boolean): AuthStatusBody {
  return { enabled };
}

export function assertRequestAllowed(args: {
  enabled: boolean;
  principal: AuthPrincipal | undefined;
}): RequestAllowed {
  if (!args.enabled) {
    return { allowed: true };
  }
  if (args.principal) {
    return { allowed: true };
  }
  return { allowed: false, status: 401, body: AUTHENTICATION_REQUIRED };
}

export function bearerTokenFromAuthorizationHeader(
  authorizationHeader: string | undefined,
): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }
  const match = /^Bearer\s+(\S+)/i.exec(authorizationHeader.trim());
  return match?.[1];
}

export type AuthenticationFailedBody = {
  status: "error";
  errorType: "AuthenticationFailed";
};

export const AUTHENTICATION_FAILED: AuthenticationFailedBody = {
  status: "error",
  errorType: "AuthenticationFailed",
};

export type IdentityUser = {
  uuid: string;
  username: string;
  status: string;
};

export type IdentityCredential = {
  uuid?: string;
  miroirUser: string;
  passwordHash: string;
};

export type IdentityDirectory = {
  users: IdentityUser[];
  credentials: IdentityCredential[];
};

export type LoginSuccess = {
  ok: true;
  principal: AuthPrincipal;
  token: string;
};

export type LoginFailure = {
  ok: false;
  status: 401;
  body: AuthenticationFailedBody;
};

const DEFAULT_TOKEN_TTL_SECONDS = 12 * 60 * 60;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;

let processTokenSecret: string | undefined;

export function setProcessTokenSecret(secret: string): void {
  processTokenSecret = secret;
}

export function getProcessTokenSecret(env: Record<string, string | undefined> = process.env): string {
  if (processTokenSecret) {
    return processTokenSecret;
  }
  if (env.MIROIR_AUTH_TOKEN_SECRET) {
    processTokenSecret = env.MIROIR_AUTH_TOKEN_SECRET;
    return processTokenSecret;
  }
  processTokenSecret = `ephemeral-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return processTokenSecret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlToBytes(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

async function hmacSha256Base64Url(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function hashPassword(password: string): Promise<string> {
  const { randomBytes, scrypt } = await import("node:crypto");
  const { promisify } = await import("node:util");
  const scryptAsync = promisify(scrypt);
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })) as Buffer;
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");
  if (!n || !r || !p || salt.length === 0 || expected.length === 0) {
    return false;
  }
  const { scrypt } = await import("node:crypto");
  const { promisify } = await import("node:util");
  const scryptAsync = promisify(scrypt);
  const derived = (await scryptAsync(password, salt, expected.length, { N: n, r, p })) as Buffer;
  if (derived.length !== expected.length) {
    return false;
  }
  const { timingSafeEqual } = await import("node:crypto");
  return timingSafeEqual(derived, expected);
}

type TokenPayload = {
  u: string;
  n: string;
  exp: number;
};

export async function issueBearerToken(
  principal: AuthPrincipal,
  secret: string,
  nowMs: number = Date.now(),
  ttlSeconds: number = DEFAULT_TOKEN_TTL_SECONDS,
): Promise<string> {
  const payload: TokenPayload = {
    u: principal.miroirUserUuid,
    n: principal.username,
    exp: Math.floor(nowMs / 1000) + ttlSeconds,
  };
  const payloadPart = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSha256Base64Url(secret, payloadPart);
  return `${payloadPart}.${signature}`;
}

export async function verifyBearerToken(
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): Promise<AuthPrincipal | undefined> {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return undefined;
  }
  const [payloadPart, signature] = parts;
  const expected = await hmacSha256Base64Url(secret, payloadPart);
  const { timingSafeEqual } = await import("node:crypto");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return undefined;
  }
  let payload: TokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadPart))) as TokenPayload;
  } catch {
    return undefined;
  }
  if (!payload.u || !payload.n || typeof payload.exp !== "number") {
    return undefined;
  }
  if (payload.exp <= Math.floor(nowMs / 1000)) {
    return undefined;
  }
  return { miroirUserUuid: payload.u, username: payload.n };
}

export async function extractPrincipalFromAuthorizationHeader(
  authorizationHeader: string | undefined,
  secret: string,
  nowMs: number = Date.now(),
): Promise<AuthPrincipal | undefined> {
  const token = bearerTokenFromAuthorizationHeader(authorizationHeader);
  if (!token) {
    return undefined;
  }
  return verifyBearerToken(token, secret, nowMs);
}

export async function loginWithPassword(
  args: { username: string; password: string },
  directory: IdentityDirectory,
  secret: string,
): Promise<LoginSuccess | LoginFailure> {
  const username = args.username.trim();
  const password = args.password;
  if (!username || !password) {
    return { ok: false, status: 401, body: AUTHENTICATION_FAILED };
  }
  const users = directory.users.filter((candidate) => candidate.username === username);
  if (users.length !== 1) {
    return { ok: false, status: 401, body: AUTHENTICATION_FAILED };
  }
  const user = users[0];
  const credentials = directory.credentials.filter((row) => row.miroirUser === user.uuid);
  if (user.status !== "active" || credentials.length !== 1) {
    return { ok: false, status: 401, body: AUTHENTICATION_FAILED };
  }
  const credential = credentials[0];
  const matches = await verifyPassword(password, credential.passwordHash);
  if (!matches) {
    return { ok: false, status: 401, body: AUTHENTICATION_FAILED };
  }
  const principal: AuthPrincipal = { miroirUserUuid: user.uuid, username: user.username };
  const token = await issueBearerToken(principal, secret);
  return { ok: true, principal, token };
}

export const ENTITY_MIROIR_USER_UUID = "d20d09e5-0685-4fc7-b9bd-fcfa3845127a";
export const ENTITY_MIROIR_USER_CREDENTIAL_UUID = "6c3ab489-1a36-4981-b5d0-bb3e02cfceed";

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

export function identityDirectoryFromInstances(
  usersValue: unknown,
  credentialsValue: unknown,
): IdentityDirectory {
  return {
    users: normalizeInstanceList(usersValue).map((row) => ({
      uuid: String(row.uuid ?? ""),
      username: String(row.username ?? ""),
      status: String(row.status ?? ""),
    })),
    credentials: normalizeInstanceList(credentialsValue).map((row) => ({
      uuid: row.uuid ? String(row.uuid) : undefined,
      miroirUser: String(row.miroirUser ?? ""),
      passwordHash: String(row.passwordHash ?? ""),
    })),
  };
}

export function findCredentialInstance(
  credentialsValue: unknown,
  miroirUserUuid: string,
): Record<string, unknown> | undefined {
  return normalizeInstanceList(credentialsValue).find(
    (row) => String(row.miroirUser ?? "") === miroirUserUuid,
  );
}

export function bindPrincipalToDirectory(
  principal: AuthPrincipal,
  directory: IdentityDirectory,
): AuthPrincipal | undefined {
  const users = directory.users.filter((row) => row.uuid === principal.miroirUserUuid);
  if (users.length !== 1) {
    return undefined;
  }
  const user = users[0];
  if (user.status !== "active" || user.username !== principal.username) {
    return undefined;
  }
  return { miroirUserUuid: user.uuid, username: user.username };
}

export function isUsableBearerToken(token: string | undefined, nowMs: number = Date.now()): boolean {
  if (!token) {
    return false;
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0]))) as TokenPayload;
    return typeof payload.exp === "number" && payload.exp > Math.floor(nowMs / 1000);
  } catch {
    return false;
  }
}

export const AUTH_CHANGE_PASSWORD_ACTION_LABEL = "auth.change-password";

export function redactCredentialSecretsFromValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactCredentialSecretsFromValue);
  }
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    return value;
  }
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  const stripHash =
    String(record.parentUuid ?? "") === ENTITY_MIROIR_USER_CREDENTIAL_UUID && "passwordHash" in record;
  for (const [key, child] of Object.entries(record)) {
    if (stripHash && key === "passwordHash") {
      continue;
    }
    next[key] = redactCredentialSecretsFromValue(child);
  }
  return next;
}

export function assertCredentialInstanceMutationAllowed(action: {
  actionType: string;
  actionLabel?: string;
  payload?: { parentUuid?: string; objects?: unknown };
}): { allowed: true } | { allowed: false; errorMessage: string } {
  if (
    action.actionType !== "createInstance" &&
    action.actionType !== "updateInstance" &&
    action.actionType !== "deleteInstance" &&
    action.actionType !== "deleteInstanceWithCascade"
  ) {
    return { allowed: true };
  }
  const objects = Array.isArray(action.payload?.objects) ? action.payload.objects : [];
  const touchesCredential =
    action.payload?.parentUuid === ENTITY_MIROIR_USER_CREDENTIAL_UUID ||
    objects.some(
      (row) =>
        !!row &&
        typeof row === "object" &&
        String((row as { parentUuid?: unknown }).parentUuid ?? "") ===
          ENTITY_MIROIR_USER_CREDENTIAL_UUID,
    );
  if (!touchesCredential) {
    return { allowed: true };
  }
  if (action.actionType === "updateInstance" && action.actionLabel === AUTH_CHANGE_PASSWORD_ACTION_LABEL) {
    return { allowed: true };
  }
  return {
    allowed: false,
    errorMessage: "MiroirUserCredential can only be updated via POST /auth/change-password",
  };
}

export async function changePassword(
  args: {
    principal: AuthPrincipal;
    currentPassword: string;
    newPassword: string;
  },
  directory: IdentityDirectory,
): Promise<
  | { ok: true; passwordHash: string }
  | { ok: false; status: 401; body: AuthenticationFailedBody }
> {
  const credentials = directory.credentials.filter(
    (row) => row.miroirUser === args.principal.miroirUserUuid,
  );
  if (credentials.length !== 1 || !args.currentPassword || !args.newPassword) {
    return { ok: false, status: 401, body: AUTHENTICATION_FAILED };
  }
  const credential = credentials[0];
  const matches = await verifyPassword(args.currentPassword, credential.passwordHash);
  if (!matches) {
    return { ok: false, status: 401, body: AUTHENTICATION_FAILED };
  }
  const passwordHash = await hashPassword(args.newPassword);
  return { ok: true, passwordHash };
}

export async function persistChangedPasswordHash(params: {
  directory: IdentityDirectory;
  principal: AuthPrincipal;
  currentPassword: string;
  newPassword: string;
}): Promise<
  | { ok: true; directory: IdentityDirectory }
  | { ok: false; status: 401; body: AuthenticationFailedBody }
> {
  const result = await changePassword(
    {
      principal: params.principal,
      currentPassword: params.currentPassword,
      newPassword: params.newPassword,
    },
    params.directory,
  );
  if (!result.ok) {
    return result;
  }
  return {
    ok: true,
    directory: {
      ...params.directory,
      credentials: params.directory.credentials.map((row) =>
        row.miroirUser === params.principal.miroirUserUuid
          ? { ...row, passwordHash: result.passwordHash }
          : row,
      ),
    },
  };
}
