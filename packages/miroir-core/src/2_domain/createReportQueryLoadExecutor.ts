import type { ApplicationDeploymentMap } from "../1_core/Deployment.js";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import type { Action2ReturnType } from "../0_interfaces/2_domain/DomainElement.js";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement.js";
import type {
  EntityInstanceCollection,
  LocalCacheAction,
  PersistenceAction,
  RestPersistenceAction,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { PersistenceStoreLocalOrRemoteInterface } from "../0_interfaces/4-services/PersistenceInterface.js";

import type {
  ReportQueryLoadExecutor,
  ReportQueryLoadRequest,
} from "./ReportQueryLoadService.js";

type DomainControllerWithRemoteStore = DomainControllerInterface & {
  getRemoteStore: () => PersistenceStoreLocalOrRemoteInterface;
};

/**
 * Collects entity UUIDs referenced by extractorInstancesByEntity extractors
 * in a resolved report query (report-triggered cache fill).
 */
export function parentUuidsFromResolvedReportQuery(
  resolvedQuery: ReportQueryLoadRequest["resolvedQuery"],
): string[] {
  const extractors = (resolvedQuery as { extractors?: Record<string, any> })
    ?.extractors;
  if (!extractors) {
    return [];
  }
  const uuids = new Set<string>();
  for (const extractor of Object.values(extractors)) {
    if (
      extractor &&
      extractor.extractorOrCombinerType === "extractorInstancesByEntity" &&
      typeof extractor.parentUuid === "string"
    ) {
      uuids.add(extractor.parentUuid);
    }
  }
  return [...uuids];
}

function isErrorResult(result: Action2ReturnType): result is Action2Error {
  return (
    result instanceof Action2Error ||
    (typeof result === "object" && (result as any)?.status == "error")
  );
}

/**
 * DomainController-backed executor: RestPersistenceAction_read per entity
 * referenced by the report query, then loadNewInstancesInLocalCache via the
 * local cache only (not handleAction — that would POST to the remote store).
 */
export function createReportQueryLoadExecutor(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  options?: { applicationSection?: "data" | "model" },
): ReportQueryLoadExecutor {
  const withStore = domainController as DomainControllerWithRemoteStore;
  if (typeof withStore.getRemoteStore !== "function") {
    throw new Error(
      "createReportQueryLoadExecutor: DomainController must expose getRemoteStore()",
    );
  }

  return async (request: ReportQueryLoadRequest): Promise<void> => {
    const parentUuids = parentUuidsFromResolvedReportQuery(request.resolvedQuery);
    if (parentUuids.length === 0) {
      return;
    }

    const section =
      request.applicationSection ?? options?.applicationSection ?? "data";
    const store = withStore.getRemoteStore();
    const collections: EntityInstanceCollection[] = [];

    for (const parentUuid of parentUuids) {
      const readAction: RestPersistenceAction = {
        actionType: "RestPersistenceAction_read",
        endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
        payload: {
          application: request.application,
          section,
          parentUuid,
        },
      };

      const result = await store.handlePersistenceAction(
        readAction as PersistenceAction,
        applicationDeploymentMap,
      );
      if (isErrorResult(result)) {
        throw new Error(
          `createReportQueryLoadExecutor: failed to read parentUuid=${parentUuid}: ${
            result.errorMessage ?? result.status
          }`,
        );
      }

      const element = result.returnedDomainElement;
      if (element && Array.isArray((element as EntityInstanceCollection).instances)) {
        collections.push({
          parentUuid:
            (element as EntityInstanceCollection).parentUuid || parentUuid,
          applicationSection:
            (element as EntityInstanceCollection).applicationSection || section,
          instances: (element as EntityInstanceCollection).instances,
        });
      } else if (Array.isArray(element)) {
        collections.push({
          parentUuid,
          applicationSection: section,
          instances: element,
        });
      } else {
        // Still register an empty entity slice so selectors stop returning EntityNotFound.
        collections.push({
          parentUuid,
          applicationSection: section,
          instances: [],
        });
      }
    }

    const loadAction: LocalCacheAction = {
      actionType: "loadNewInstancesInLocalCache",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: request.application,
        objects: collections,
      },
    };

    const loadResult = store.handleLocalCacheAction(
      loadAction,
      applicationDeploymentMap,
    );

    if (isErrorResult(loadResult)) {
      throw new Error(
        `createReportQueryLoadExecutor: loadNewInstancesInLocalCache failed: ${
          loadResult.errorMessage ?? loadResult.status
        }`,
      );
    }
  };
}
