import type { ClientEnvironment } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { StorageType } from "../0_interfaces/1_core/StorageConfiguration";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement";
import type {
  AdminStoreFactoryRegister,
  StoreSectionFactoryRegister,
} from "../0_interfaces/4-services/PersistenceStoreControllerInterface";

export type ProcessCapabilities = {
  ai: boolean;
  mcp: boolean;
  availableStoreTypes: StorageType[];
  creatableStoreTypes: StorageType[];
  storeAdministration: boolean;
  designerTools: boolean;
};

export type ProcessCapabilityName =
  | "ai"
  | "mcp"
  | "storeAdministration"
  | "availableStoreTypes"
  | "designerTools";

type ProcessCapabilitiesConfig = {
  features?: {
    ai?: boolean;
    mcp?: boolean;
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
    designerTools: features?.designerTools !== false,
    availableStoreTypes,
    creatableStoreTypes: availableStoreTypes.filter((storageType) => storageType !== "bundled"),
    storeAdministration: hasNonBundledAdminStorageType(adminStoreFactoryRegister),
  };
}

export function assertProcessCapability(
  name: ProcessCapabilityName,
  snapshot: ProcessCapabilities,
): Action2Error | void {
  const allowed = name === "availableStoreTypes" ? true : snapshot[name] === true;
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
