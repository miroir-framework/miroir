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
