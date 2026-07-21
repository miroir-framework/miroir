import type { ApplicationDeploymentMap } from "../1_core/Deployment.js";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import type { Action2ReturnType } from "../0_interfaces/2_domain/DomainElement.js";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement.js";
import type {
  EntityInstanceCollection,
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
  return result instanceof Action2Error || result.status === "error";
}

/**
 * DomainController-backed executor: RestPersistenceAction_read per entity
 * referenced by the report query, then loadNewInstancesInLocalCache.
 */
export function createReportQueryLoadExecutor(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  options?: { applicationSection?: "data" | "model" },
): ReportQueryLoadExecutor {
  const applicationSection = options?.applicationSection ?? "data";
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

    const remote = withStore.getRemoteStore();
    const collections: EntityInstanceCollection[] = [];

    for (const parentUuid of parentUuids) {
      const readAction: RestPersistenceAction = {
        actionType: "RestPersistenceAction_read",
        endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
        payload: {
          application: request.application,
          section: applicationSection,
          parentUuid,
        },
      };

      const result = await remote.handlePersistenceAction(
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
        collections.push(element as EntityInstanceCollection);
      } else if (Array.isArray(element)) {
        collections.push({
          parentUuid,
          applicationSection,
          instances: element,
        });
      }
    }

    if (collections.length === 0) {
      return;
    }

    const loadResult = await domainController.handleAction(
      {
        actionType: "loadNewInstancesInLocalCache",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: request.application,
          objects: collections,
        },
      },
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
