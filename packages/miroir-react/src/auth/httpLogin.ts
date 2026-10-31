// #263, #633 D5: the browser's authentication calls, plain fetch calls to the server. A host with
// another transport (Electron IPC) gives its own `requestLoginToken` through MiroirShellHostContext.

/** Whether authentication is on: the server's `/auth/status`. */
export async function fetchAuthenticationEnabledOverHttp(): Promise<boolean> {
  try {
    const response = await fetch("/auth/status");
    const body = await response.json();
    return body?.enabled === true;
  } catch {
    return false;
  }
}

/** The Bearer token for these credentials, or undefined when the login fails. */
export async function requestLoginTokenOverHttp(username: string, password: string): Promise<string | undefined> {
  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = await response.json();
    return response.ok && typeof body?.token === "string" ? body.token : undefined;
  } catch {
    return undefined;
  }
}
