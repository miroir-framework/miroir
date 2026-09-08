const TOKEN_KEY = "miroir.auth.token";

// Default off until /auth/status is read so UI tests and hatch-off stay on today's chrome.
let authenticationEnabled = false;
let memoryToken: string | undefined;

export function setAuthenticationEnabled(enabled: boolean): void {
  authenticationEnabled = enabled;
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
  if (typeof sessionStorage === "undefined") {
    return;
  }
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}
