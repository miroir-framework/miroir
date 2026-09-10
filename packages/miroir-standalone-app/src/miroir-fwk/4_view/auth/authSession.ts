import { useSyncExternalStore } from "react";

import { readUsableBearerPrincipal, type AuthPrincipal } from "miroir-core";

const TOKEN_KEY = "miroir.auth.token";

// Default off until /auth/status is read so UI tests and hatch-off stay on today's chrome.
let authenticationEnabled = false;
let memoryToken: string | undefined;
const listeners = new Set<() => void>();

export type AuthSessionSnapshot = {
  enabled: boolean;
  token: string | undefined;
  principal: AuthPrincipal | undefined;
};

let cachedSnapshot: AuthSessionSnapshot = {
  enabled: false,
  token: undefined,
  principal: undefined,
};

function emitAuthSessionChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function currentSnapshot(): AuthSessionSnapshot {
  const token = getAuthToken();
  const next: AuthSessionSnapshot = {
    enabled: authenticationEnabled,
    token,
    principal: readUsableBearerPrincipal(token),
  };
  if (
    cachedSnapshot.enabled === next.enabled &&
    cachedSnapshot.token === next.token &&
    cachedSnapshot.principal?.miroirUserUuid === next.principal?.miroirUserUuid &&
    cachedSnapshot.principal?.username === next.principal?.username
  ) {
    return cachedSnapshot;
  }
  cachedSnapshot = next;
  return cachedSnapshot;
}

function subscribeAuthSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAuthenticationEnabled(enabled: boolean): void {
  authenticationEnabled = enabled;
  emitAuthSessionChange();
}

export function getAuthenticationEnabled(): boolean {
  return authenticationEnabled;
}

export function getAuthToken(): string | undefined {
  if (memoryToken) {
    return memoryToken;
  }
  if (typeof sessionStorage === "undefined") {
    return undefined;
  }
  const stored = sessionStorage.getItem(TOKEN_KEY);
  memoryToken = stored ?? undefined;
  return memoryToken;
}

export function setAuthToken(token: string | undefined): void {
  memoryToken = token;
  if (typeof sessionStorage !== "undefined") {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }
  emitAuthSessionChange();
}

export function useAuthSession(): AuthSessionSnapshot {
  return useSyncExternalStore(subscribeAuthSession, currentSnapshot, currentSnapshot);
}
