import type { ClientEnvironment } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { StorageType } from "../0_interfaces/1_core/StorageConfiguration";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement";
import type {
  AdminStoreFactoryRegister,
  StoreSectionFactoryRegister,
} from "../0_interfaces/4-services/PersistenceStoreControllerInterface";

/** Agent backend picked in the environment config before start (#409). */
export type AgentBackend = "cursor" | "claude" | "none";

export type ProcessCapabilities = {
  ai: boolean;
  mcp: boolean;
  agentBackend: AgentBackend;
  availableStoreTypes: StorageType[];
  creatableStoreTypes: StorageType[];
  storeAdministration: boolean;
  designerTools: boolean;
};

export type ProcessCapabilityName =
  | "ai"
  | "mcp"
  | "agent"
  | "storeAdministration"
  | "availableStoreTypes"
  | "designerTools";

type ProcessCapabilitiesConfig = {
  features?: {
    ai?: boolean;
    mcp?: boolean;
    agentBackend?: AgentBackend;
    /** #409: read as `agentBackend: "cursor"` when `agentBackend` is absent, for one release. */
    cursor?: boolean;
    designerTools?: boolean;
  };
};

export type GetProcessCapabilitiesParams = {
  config: ProcessCapabilitiesConfig;
  environment: ClientEnvironment;
  storeSectionFactoryRegister: ReadonlyMap<string, unknown> | StoreSectionFactoryRegister;
  adminStoreFactoryRegister: ReadonlyMap<string, unknown> | AdminStoreFactoryRegister;
};

function storageTypeFromFactoryKey(key: string): string | undefined {
  try {
    const parsed = JSON.parse(key);
    if (parsed && typeof parsed === "object" && typeof parsed.storageType === "string") {
      return parsed.storageType;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function uniqueStorageTypesFromRegister(
  register: ReadonlyMap<string, unknown>,
): StorageType[] {
  const seen = new Set<string>();
  const storageTypes: StorageType[] = [];
  for (const key of register.keys()) {
    const storageType = storageTypeFromFactoryKey(key);
    if (!storageType || seen.has(storageType)) {
      continue;
    }
    seen.add(storageType);
    storageTypes.push(storageType as StorageType);
  }
  return storageTypes;
}

function hasNonBundledAdminStorageType(register: ReadonlyMap<string, unknown>): boolean {
  for (const key of register.keys()) {
    const storageType = storageTypeFromFactoryKey(key);
    if (storageType && storageType !== "bundled") {
      return true;
    }
  }
  return false;
}

export function getProcessCapabilities({
  config,
  environment,
  storeSectionFactoryRegister,
  adminStoreFactoryRegister,
}: GetProcessCapabilitiesParams): ProcessCapabilities {
  const features = config.features;
  const availableStoreTypes = uniqueStorageTypesFromRegister(storeSectionFactoryRegister);
  return {
    ai: features?.ai === true && environment !== "sandbox",
    mcp: features?.mcp === true,
    agentBackend: features?.agentBackend ?? (features?.cursor === true ? "cursor" : "none"),
    designerTools: features?.designerTools !== false,
    availableStoreTypes,
    creatableStoreTypes: availableStoreTypes.filter((storageType) => storageType !== "bundled"),
    storeAdministration: hasNonBundledAdminStorageType(adminStoreFactoryRegister),
  };
}

export function isAgentBackendAllowed(snapshot: ProcessCapabilities): boolean {
  return snapshot.ai === true && snapshot.mcp === true && snapshot.agentBackend !== "none";
}

export function assertProcessCapability(
  name: ProcessCapabilityName,
  snapshot: ProcessCapabilities,
): Action2Error | void {
  const allowed =
    name === "availableStoreTypes"
      ? true
      : name === "agent"
        ? snapshot.agentBackend !== "none"
        : snapshot[name] === true;
  if (allowed) {
    return;
  }
  return new Action2Error(
    "FeatureUnavailable",
    `Process capability "${name}" is not available`,
    undefined,
    undefined,
    { capability: name },
  );
}
