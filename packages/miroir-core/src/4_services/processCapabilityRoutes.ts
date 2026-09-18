export const ELECTRON_LOOPBACK_ROOT_API_URL = "http://127.0.0.1:3080";

export function shouldMountCopilotKitRoute(ai: boolean): boolean {
  return ai === true;
}

export function shouldMountMcpHttp(mcp: boolean): boolean {
  return mcp === true;
}

export function shouldListenLoopbackHttp(flags: { ai: boolean; mcp: boolean }): boolean {
  return flags.ai === true || flags.mcp === true;
}

const ELECTRON_LOOPBACK_CORS_PORTS = new Set(["5173", "3000", "3080"]);

/**
 * Electron loopback HTTP (CopilotKit / MCP) must not reflect arbitrary Origin
 * values. Allow packaged `file:` / `app:` / `null`, Vite, and the loopback
 * runtime itself.
 */
export function isAllowedElectronLoopbackOrigin(origin: string): boolean {
  if (origin === "null") {
    return true;
  }
  try {
    const url = new URL(origin);
    if (url.protocol === "file:" || url.protocol === "app:") {
      return true;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      return false;
    }
    const port = url.port || (url.protocol === "https:" ? "443" : "80");
    return ELECTRON_LOOPBACK_CORS_PORTS.has(port);
  } catch {
    return false;
  }
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function electronRuntimeBaseUrl(serverConfig: { rootApiUrl: string }): string {
  try {
    const parsed = new URL(serverConfig.rootApiUrl);
    if (parsed.protocol === "app:") {
      return ELECTRON_LOOPBACK_ROOT_API_URL;
    }
    const protocol = parsed.protocol === "https:" ? "https:" : "http:";
    const host =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"
        ? parsed.hostname
        : "127.0.0.1";
    if (parsed.port) {
      return `${protocol}//${host}:${parsed.port}`;
    }
    return `${protocol}//${host}`;
  } catch {
    return ELECTRON_LOOPBACK_ROOT_API_URL;
  }
}

export function copilotRuntimeUrl(env: string, base: string): string {
  if (env === "electron") {
    return `${trimSlash(base)}/api/copilotkit`;
  }
  return "/api/copilotkit";
}

export function browserMcpServerUrl(env?: string, base?: string): string {
  if (env === "electron" && base) {
    return trimSlash(base);
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://127.0.0.1";
}
