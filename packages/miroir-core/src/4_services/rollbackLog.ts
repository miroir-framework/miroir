import { getEndpointActions } from "../0_interfaces/1_core/endpointDefinition";
import { defaultMiroirModelEnvironment } from "../1_core/Model";

export type LogPhase = "bootstrap" | "rollback" | "query" | "assertion";

export type RollbackInstanceCollection = {
  applicationSection?: string;
  parentName?: string;
  parentUuid?: string;
  instances?: unknown[];
};

export function formatRollbackSectionSummary(
  application: string,
  section: string,
  entities: number,
  instances: number,
): string {
  return `rollback application=${application} section=${section} entities=${entities} instances=${instances}`;
}

export function formatRollbackEntityDebug(
  application: string,
  section: string,
  entityName: string,
  instances: number,
): string {
  return `rollback application=${application} section=${section} entity=${entityName} instances=${instances}`;
}

export function summarizeRollbackInstanceCollections(
  application: string,
  collections: RollbackInstanceCollection[],
): { summaries: string[]; perEntity: string[] } {
  const bySection = new Map<string, { entities: number; instances: number }>();
  const perEntity: string[] = [];
  for (const collection of collections) {
    const section = collection.applicationSection ?? "unknown";
    const entityName = collection.parentName ?? collection.parentUuid ?? "unknown";
    const count = Array.isArray(collection.instances) ? collection.instances.length : 0;
    const current = bySection.get(section) ?? { entities: 0, instances: 0 };
    current.entities += 1;
    current.instances += count;
    bySection.set(section, current);
    perEntity.push(formatRollbackEntityDebug(application, section, entityName, count));
  }
  const summaries = [...bySection.entries()].map(([section, totals]) =>
    formatRollbackSectionSummary(application, section, totals.entities, totals.instances),
  );
  return { summaries, perEntity };
}

let logPhaseByActionType: Map<string, LogPhase> | undefined;

/**
 * #341: the log phase declared on the definition of a bundled Miroir action (`logPhase`).
 */
export function logPhaseForActionType(actionType: string): LogPhase | undefined {
  if (!logPhaseByActionType) {
    logPhaseByActionType = new Map();
    for (const endpoint of Object.values(defaultMiroirModelEnvironment.endpointsByUuid)) {
      for (const action of getEndpointActions(endpoint) ?? []) {
        if (action.logPhase) {
          logPhaseByActionType.set(action.actionParameters.actionType.definition, action.logPhase);
        }
      }
    }
  }
  return logPhaseByActionType.get(actionType);
}
