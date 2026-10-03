/**
 * #381 — a details Report (extractorByPrimaryKey) on a lazily cached Entity loads
 * one row. That row must not replace the Entity's full segment nor mark it as a
 * fresh complete set, whether the list Report is opened before or after.
 */
import { describe, expect, it, vi } from "vitest";
import {
  ReportQueryLoadService,
  createReportQueryLoadExecutor,
  createSegmentHeaderLookupFromLocalCacheSnapshot,
  getReduxDeploymentsStateIndex,
  isReportQueryLoadSegmentSufficient,
  type ApplicationDeploymentMap,
  type EntityInstance,
  type ReportQueryLoadRequest,
} from "miroir-core";
import { entityBlob, entityDefinitionBlob } from "miroir-app-miroir";

import { LocalCache } from "../src/index.js";

const APP = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DEPLOY = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const BLOB = entityBlob.uuid as string;

const applicationDeploymentMap: ApplicationDeploymentMap = { [APP]: DEPLOY };
const fullIndex = getReduxDeploymentsStateIndex(DEPLOY, "data", BLOB, "full");

const storedBlobs: EntityInstance[] = [
  "11111111-0000-4000-8000-000000000001",
  "11111111-0000-4000-8000-000000000002",
  "11111111-0000-4000-8000-000000000003",
].map((uuid, i) => ({ uuid, parentUuid: BLOB, name: `blob-${i + 1}` }) as EntityInstance);
const DETAILS_UUID = storedBlobs[1].uuid;

function listRequest(): ReportQueryLoadRequest {
  return {
    application: APP,
    deploymentUuid: DEPLOY,
    reportUuid: "list",
    applicationSection: "data",
    resolvedQuery: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: APP,
      extractors: {
        blobs: { extractorOrCombinerType: "extractorInstancesByEntity", parentUuid: BLOB },
      },
    },
    queryParams: {},
  };
}

function detailsRequest(instanceUuid: string = DETAILS_UUID): ReportQueryLoadRequest {
  return {
    application: APP,
    deploymentUuid: DEPLOY,
    reportUuid: "details",
    applicationSection: "data",
    resolvedQuery: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: APP,
      extractors: {
        blob: {
          extractorOrCombinerType: "extractorByPrimaryKey",
          parentUuid: BLOB,
          instanceUuid,
        },
      },
    },
    queryParams: {},
  };
}

/** A LocalCache behind a report load service, over a store holding `store` (default `storedBlobs`). */
function setup(store: EntityInstance[] = storedBlobs) {
  const localCache = new LocalCache();
  const handlePersistenceAction = vi.fn(async (action: any) => {
    if (action.actionType === "runBoxedQueryAction") {
      const [extractorKey, extractor] = Object.entries(action.payload.query.extractors)[0] as [
        string,
        { instanceUuid: string },
      ];
      return {
        status: "ok" as const,
        returnedDomainElement: {
          [extractorKey]: store.find((b) => b.uuid === extractor.instanceUuid),
        },
      };
    }
    return {
      status: "ok" as const,
      returnedDomainElement: { parentUuid: BLOB, applicationSection: "data", instances: store },
    };
  });
  const domainController = {
    getRemoteStore: () => ({
      handlePersistenceAction,
      handleLocalCacheAction: (action: any, map: any) =>
        localCache.handleLocalCacheAction(action, map),
    }),
  } as any;
  const service = new ReportQueryLoadService(
    createReportQueryLoadExecutor(domainController, applicationDeploymentMap),
    {
      isSegmentSufficient: (request) =>
        isReportQueryLoadSegmentSufficient(
          request,
          createSegmentHeaderLookupFromLocalCacheSnapshot(localCache.getState().presentModelSnapshot)
        ),
    }
  );
  const fullSegment = () => localCache.getState().presentModelSnapshot.current[fullIndex];
  return { service, handlePersistenceAction, fullSegment };
}

describe("381 — primary-key load on a lazily cached Entity keeps the full segment whole", () => {
  it("Blob is lazily cached", () => {
    expect(entityDefinitionBlob.cache?.cacheAllInstancesOnRefresh).toBe(false);
  });

  it("details then list: the list loads and shows all instances", async () => {
    const { service, handlePersistenceAction, fullSegment } = setup();

    await expect(service.ensureLoaded(detailsRequest())).resolves.toBe("ready");
    expect(Object.keys(fullSegment()?.entities ?? {})).toEqual([DETAILS_UUID]);
    expect(fullSegment()?.segment).toEqual({ kind: "full", freshness: "stale" });

    await expect(service.ensureLoaded(listRequest())).resolves.toBe("ready");
    expect(handlePersistenceAction).toHaveBeenCalledTimes(2);
    expect(handlePersistenceAction.mock.calls[1][0].actionType).toBe("RestPersistenceAction_read");
    expect(Object.keys(fullSegment()?.entities ?? {}).sort()).toEqual(
      storedBlobs.map((b) => b.uuid).sort()
    );
    expect(fullSegment()?.segment).toEqual({ kind: "full", freshness: "fresh" });
  });

  it("list then details: the full segment keeps all instances", async () => {
    const { service, handlePersistenceAction, fullSegment } = setup();

    await expect(service.ensureLoaded(listRequest())).resolves.toBe("ready");
    expect(Object.keys(fullSegment()?.entities ?? {})).toHaveLength(storedBlobs.length);

    // force a details fetch: the row is already there, so it would short-circuit otherwise
    await expect(
      service.ensureLoaded({ ...detailsRequest(), forceRefresh: true })
    ).resolves.toBe("ready");
    expect(handlePersistenceAction).toHaveBeenCalledTimes(2);
    expect(handlePersistenceAction.mock.calls[1][0].actionType).toBe("runBoxedQueryAction");
    expect(Object.keys(fullSegment()?.entities ?? {}).sort()).toEqual(
      storedBlobs.map((b) => b.uuid).sort()
    );
    expect(fullSegment()?.segment).toEqual({ kind: "full", freshness: "fresh" });

    // the list is still served from the cache
    await expect(service.ensureLoaded(listRequest())).resolves.toBe("ready");
    expect(handlePersistenceAction).toHaveBeenCalledTimes(2);
  });

  it("two details Reports keep both rows, and a reopened details Report needs no fetch", async () => {
    const { service, handlePersistenceAction, fullSegment } = setup();

    await service.ensureLoaded(detailsRequest(storedBlobs[0].uuid));
    await service.ensureLoaded(detailsRequest(storedBlobs[2].uuid));
    expect(Object.keys(fullSegment()?.entities ?? {}).sort()).toEqual(
      [storedBlobs[0].uuid, storedBlobs[2].uuid].sort()
    );
    expect(fullSegment()?.segment).toEqual({ kind: "full", freshness: "stale" });

    await expect(service.ensureLoaded(detailsRequest(storedBlobs[0].uuid))).resolves.toBe("ready");
    expect(handlePersistenceAction).toHaveBeenCalledTimes(2);
  });

  it("a refetched row replaces its cached value: a field removed in storage is gone", async () => {
    const store = storedBlobs.map((b) => ({ ...b, description: "old" }) as EntityInstance);
    const { service, fullSegment } = setup(store);
    await service.ensureLoaded(listRequest());

    const { description: _removed, ...withoutDescription } = store[1] as any;
    store[1] = withoutDescription as EntityInstance;
    await service.ensureLoaded({ ...detailsRequest(), forceRefresh: true });

    expect(fullSegment()?.entities?.[DETAILS_UUID]).not.toHaveProperty("description");
    expect(fullSegment()?.entities?.[storedBlobs[0].uuid]).toMatchObject({ description: "old" });
    expect(Object.keys(fullSegment()?.entities ?? {})).toHaveLength(storedBlobs.length);
  });
});
