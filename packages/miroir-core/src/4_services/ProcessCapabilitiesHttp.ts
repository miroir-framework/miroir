import { Action2Error } from "../0_interfaces/2_domain/DomainElement.js";
import type {
  RestClientCallReturnType,
  RestClientInterface,
} from "../0_interfaces/4-services/PersistenceInterface.js";
import type { ProcessCapabilities } from "../1_core/processCapabilities.js";

export const FAIL_CLOSED_PROCESS_CAPABILITIES: ProcessCapabilities = {
  ai: false,
  mcp: false,
  cursor: false,
  designerTools: true,
  availableStoreTypes: [],
  creatableStoreTypes: [],
  storeAdministration: false,
};

export type ProcessCapabilitiesHttpResult = {
  status: number;
  data: { status: "ok"; capabilities: ProcessCapabilities };
};

function pathWithoutQuery(url: string): string {
  return (url.split("?")[0] ?? url).replace(/\/+$/, "") || "/";
}

function isCapabilitiesPath(path: string): boolean {
  return path === "/capabilities" || path.endsWith("/capabilities");
}

export function handleProcessCapabilitiesHttpRoute(args: {
  url: string;
  endpoint?: string;
  capabilities?: ProcessCapabilities;
}): ProcessCapabilitiesHttpResult | undefined {
  const path = pathWithoutQuery(args.url);
  const endpointPath = args.endpoint ? pathWithoutQuery(args.endpoint) : path;
  if (!isCapabilitiesPath(path) && !isCapabilitiesPath(endpointPath)) {
    return undefined;
  }
  return {
    status: 200,
    data: {
      status: "ok",
      capabilities: args.capabilities ?? FAIL_CLOSED_PROCESS_CAPABILITIES,
    },
  };
}

export async function fetchProcessCapabilities(
  client: RestClientInterface,
): Promise<ProcessCapabilities> {
  const result: RestClientCallReturnType = await client.get("/capabilities", "/capabilities");
  if (result instanceof Action2Error) {
    throw new Error(
      `fetchProcessCapabilities failed: ${result.errorMessage ?? result.errorType}`,
    );
  }
  const capabilities = result.data?.capabilities;
  if (!capabilities || typeof capabilities !== "object") {
    throw new Error("fetchProcessCapabilities: missing capabilities in response");
  }
  return capabilities as ProcessCapabilities;
}
