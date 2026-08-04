import type { ApplicationDeploymentMap } from "../1_core/Deployment.js";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import type { Action2ReturnType } from "../0_interfaces/2_domain/DomainElement.js";
import { Action2Error, Domain2ElementFailed } from "../0_interfaces/2_domain/DomainElement.js";
import type {
  BoxedQueryWithExtractorCombinerTransformer,
  EntityInstance,
  EntityInstanceCollection,
  Extractor,
  LocalCacheAction,
  PersistenceAction,
  RestPersistenceAction,
  RunBoxedQueryAction,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { PersistenceStoreLocalOrRemoteInterface } from "../0_interfaces/4-services/PersistenceInterface.js";
import {
  parentUuidsFromResolvedReportQuery,
  reportQueryLoadTargetsFromResolvedReportQuery,
  resolveReportQueryLoadAttributes,
  type ReportQueryLoadTarget,
} from "../1_core/localCache/reportQueryLoadSegment.js";

import type {
  ReportQueryLoadExecutor,
  ReportQueryLoadRequest,
} from "./ReportQueryLoadService.js";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory.js";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "createReportQueryLoadExecutor"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

type DomainControllerWithRemoteStore = DomainControllerInterface & {
  getRemoteStore: () => PersistenceStoreLocalOrRemoteInterface;
};

export { parentUuidsFromResolvedReportQuery };

const RUN_BOXED_QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";

function isErrorResult(result: Action2ReturnType): result is Action2Error {
  return (
    result instanceof Action2Error ||
    (typeof result === "object" && (result as any)?.status == "error")
  );
}

function isQueryFailureValue(value: unknown): value is Domain2ElementFailed {
  return (
    value instanceof Domain2ElementFailed ||
    (typeof value === "object" &&
      value !== null &&
      ("queryFailure" in value || (value as { elementType?: string }).elementType === "failure"))
  );
}

function segmentFieldsForProjection(projectionAttributes?: string[]) {
  return projectionAttributes && projectionAttributes.length > 0
    ? ({ cacheSegment: "partial" as const, attributes: projectionAttributes })
    : ({ cacheSegment: "full" as const });
}

function instanceFromPrimaryKeyQueryResult(
  returnedDomainElement: unknown,
  extractorKey: string,
): EntityInstance | undefined {
  if (!returnedDomainElement || typeof returnedDomainElement !== "object") {
    return undefined;
  }
  const row = (returnedDomainElement as Record<string, unknown>)[extractorKey];
  if (!row || typeof row !== "object" || isQueryFailureValue(row)) {
    return undefined;
  }
  return row as EntityInstance;
}

function buildPrimaryKeyQueryAction(
  request: ReportQueryLoadRequest,
  section: "data" | "model",
  extractorKey: string,
  extractor: Extractor,
  projectionAttributes?: string[],
): RunBoxedQueryAction {
  const resolved = request.resolvedQuery as BoxedQueryWithExtractorCombinerTransformer;
  const extractorForQuery: Extractor = {
    ...extractor,
    ...(projectionAttributes?.length ? { attributes: projectionAttributes } : {}),
  };
  return {
    actionType: "runBoxedQueryAction",
    endpoint: RUN_BOXED_QUERY_ENDPOINT,
    payload: {
      application: request.application,
      applicationSection: section,
      queryExecutionStrategy: "storage",
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: request.application,
        pageParams: resolved.pageParams ?? {},
        queryParams: request.queryParams ?? {},
        contextResults: resolved.contextResults ?? {},
        extractors: {
          [extractorKey]: extractorForQuery,
        },
      },
    },
  };
}

function collectionFromReadResult(
  target: ReportQueryLoadTarget,
  section: "data" | "model",
  element: unknown,
  projectionAttributes?: string[],
): EntityInstanceCollection {
  const segmentFields = segmentFieldsForProjection(projectionAttributes);
  const parentUuid = target.parentUuid;

  if (element && Array.isArray((element as EntityInstanceCollection).instances)) {
    const collection = element as EntityInstanceCollection;
    return {
      parentUuid: collection.parentUuid || parentUuid,
      applicationSection: collection.applicationSection || section,
      instances: collection.instances,
      ...segmentFields,
    };
  }
  if (Array.isArray(element)) {
    return {
      parentUuid,
      applicationSection: section,
      instances: element,
      ...segmentFields,
    };
  }
  if (element && typeof element === "object" && !Array.isArray(element) && target.instanceUuid) {
    return {
      parentUuid,
      applicationSection: section,
      instances: [element as EntityInstance],
      ...segmentFields,
    };
  }
  return {
    parentUuid,
    applicationSection: section,
    instances: [],
    ...segmentFields,
  };
}

/**
 * DomainController-backed executor: RestPersistenceAction_read per entity
 * referenced by the report query, then loadNewInstancesInLocalCache via the
 * local cache only (not handleAction — that would POST to the remote store).
 *
 * #214: when `request.projection.attributes` is set, reads are projected and
 * the local-cache write targets the partial segment.
 *
 * extractorByPrimaryKey targets use runBoxedQueryAction (storage) — the server
 * has no CRUD GET-by-instanceUuid route; only /all is exposed on RestServer.
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
    const loadTargets = reportQueryLoadTargetsFromResolvedReportQuery(
      request.resolvedQuery
    );
    if (loadTargets.length === 0) {
      return;
    }

    const section =
      request.applicationSection ?? options?.applicationSection ?? "data";
    const projectionAttributes = resolveReportQueryLoadAttributes(request);
    const store = withStore.getRemoteStore();
    const collections: EntityInstanceCollection[] = [];
    const resolvedExtractors = (
      request.resolvedQuery as { extractors?: Record<string, Record<string, unknown>> }
    )?.extractors;

    log.info(
      "createReportQueryLoadExecutor: loadTargets",
      loadTargets,
      "projection",
      projectionAttributes,
    );

    for (const target of loadTargets) {
      let result: Action2ReturnType;

      if (target.instanceUuid && target.extractorKey) {
        const extractor = resolvedExtractors?.[target.extractorKey];
        if (!extractor) {
          throw new Error(
            `createReportQueryLoadExecutor: missing extractor "${target.extractorKey}" in resolved query`,
          );
        }
        const queryAction = buildPrimaryKeyQueryAction(
          request,
          section,
          target.extractorKey,
          extractor as Extractor,
          projectionAttributes,
        );
        log.info(
          "createReportQueryLoadExecutor: runBoxedQueryAction for primary key",
          target.extractorKey,
          target.instanceUuid,
        );
        result = await store.handlePersistenceAction(
          queryAction as PersistenceAction,
          applicationDeploymentMap,
        );
        if (isErrorResult(result)) {
          throw new Error(
            `createReportQueryLoadExecutor: runBoxedQueryAction failed for parentUuid=${target.parentUuid} instanceUuid=${target.instanceUuid}: ${
              result.errorMessage ?? result.status
            }`,
          );
        }
        const instance = instanceFromPrimaryKeyQueryResult(
          result.returnedDomainElement,
          target.extractorKey,
        );
        if (!instance) {
          throw new Error(
            `createReportQueryLoadExecutor: runBoxedQueryAction returned no instance for extractor "${target.extractorKey}"`,
          );
        }
        collections.push({
          parentUuid: target.parentUuid,
          applicationSection: section,
          instances: [instance],
          ...segmentFieldsForProjection(projectionAttributes),
        });
        continue;
      }

      const readAction: RestPersistenceAction = {
        actionType: "RestPersistenceAction_read",
        endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
        payload: {
          application: request.application,
          section,
          parentUuid: target.parentUuid,
          ...(projectionAttributes && projectionAttributes.length > 0
            ? { attributes: projectionAttributes }
            : {}),
        },
      };

      result = await store.handlePersistenceAction(
        readAction as PersistenceAction,
        applicationDeploymentMap,
      );
      if (isErrorResult(result)) {
        throw new Error(
          `createReportQueryLoadExecutor: failed to read parentUuid=${target.parentUuid}: ${
            result.errorMessage ?? result.status
          }`,
        );
      }

      collections.push(
        collectionFromReadResult(
          target,
          section,
          result.returnedDomainElement,
          projectionAttributes,
        ),
      );
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
