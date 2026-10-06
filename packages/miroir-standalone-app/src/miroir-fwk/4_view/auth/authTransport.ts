import { ElectronRestClient } from "../services/ElectronIpcProxy.js";

// #263: in Electron there is no HTTP server behind the window: `/auth/status` and `/auth/login`
// go to the main process over IPC (`rest-call`), which answers with its own hatch and directory.
// In the browser they stay plain fetch calls to the server.

function isElectron(): boolean {
  return typeof (globalThis as any).window?.electronAPI?.callMiroirIpc === "function";
}

/** Whether authentication is on: the server's (or Electron main process's) `/auth/status`. */
export async function fetchAuthenticationEnabled(): Promise<boolean> {
  try {
    if (isElectron()) {
      const response = await new ElectronRestClient().get("/auth/status", "/auth/status");
      return "data" in response && (response.data as { enabled?: unknown })?.enabled === true;
    }
    const response = await fetch("/auth/status");
    const body = await response.json();
    return body?.enabled === true;
  } catch {
    return false;
  }
}

/** The Bearer token for these credentials, or undefined when the login fails. */
export async function requestLoginToken(username: string, password: string): Promise<string | undefined> {
  try {
    if (isElectron()) {
      const response = await new ElectronRestClient().post("/auth/login", "/auth/login", { username, password });
      if (!("data" in response) || response.status !== 200) {
        return undefined;
      }
      const token = (response.data as { token?: unknown })?.token;
      return typeof token === "string" ? token : undefined;
    }
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
