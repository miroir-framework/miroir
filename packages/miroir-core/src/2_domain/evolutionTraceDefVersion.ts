export type DefinitionVersionResolutionMethod =
  | "instanceParentDefinitionVersion"
  | "actionPayload"
  | "applicationVersionCrossEntityVersion"
  | "unresolved";

export type ResolveDefinitionVersionResult = {
  definitionVersionUuid: string | undefined;
  resolution: DefinitionVersionResolutionMethod;
};

export type ResolveDefinitionVersionInput = {
  instance?: { parentDefinitionVersionUuid?: string };
  entityDefinitionUuidFromPayload?: string;
  crossEntityLookup?: {
    currentApplicationVersionUuid: string;
    targetEntityUuid?: string;
    entries: Array<{
      applicationVersion: string;
      /** #217 Phase 12 primary FK name */
      entityVersion?: string;
      /** @deprecated Use entityVersion */
      entityDefinition?: string;
      /** Optional entity UUID when the caller can resolve EntityVersion → Entity. */
      entityUuid?: string;
    }>;
  };
  /** Called on unresolved path — defaults to console.warn (no silent drop). */
  warn?: (message: string) => void;
};

/**
 * Resolves the target EntityVersion UUID for a trace event,
 * with explicit resolution method for #15 compatibility.
 *
 * Precedence:
 * 1. instance.parentDefinitionVersionUuid
 * 2. action payload entityDefinitionUuid
 * 3. ApplicationVersionCrossEntityVersion lookup
 * 4. unresolved (+ warning)
 */
export function resolveDefinitionVersionForTraceEvent(
  input: ResolveDefinitionVersionInput,
): ResolveDefinitionVersionResult {
  const fromInstance = input.instance?.parentDefinitionVersionUuid;
  if (fromInstance) {
    return {
      definitionVersionUuid: fromInstance,
      resolution: "instanceParentDefinitionVersion",
    };
  }

  const fromPayload = input.entityDefinitionUuidFromPayload;
  if (fromPayload) {
    return {
      definitionVersionUuid: fromPayload,
      resolution: "actionPayload",
    };
  }

  const lookup = input.crossEntityLookup;
  if (lookup) {
    const match = lookup.entries.find((entry) => {
      if (entry.applicationVersion !== lookup.currentApplicationVersionUuid) {
        return false;
      }
      if (lookup.targetEntityUuid && entry.entityUuid) {
        return entry.entityUuid === lookup.targetEntityUuid;
      }
      return true;
    });
    if (match) {
      const versionUuid = match.entityVersion ?? match.entityDefinition;
      if (versionUuid) {
        return {
          definitionVersionUuid: versionUuid,
          resolution: "applicationVersionCrossEntityVersion",
        };
      }
    }
  }

  // Path 4: unresolved — explicit warning, no silent drop.
  const warn = input.warn ?? ((message: string) => console.warn(message));
  warn(
    "resolveDefinitionVersionForTraceEvent: could not resolve targetDefinitionVersionUuid (instance, action payload, and ApplicationVersionCrossEntityVersion lookup all empty)",
  );
  return {
    definitionVersionUuid: undefined,
    resolution: "unresolved",
  };
}
