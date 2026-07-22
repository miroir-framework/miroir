/**
 * #214 Phase 5 — Blob tracer: projected list without `contents` → partial segment.
 * Vertical slice over report load + LocalCache segments + mutation guard.
 */
import { describe, expect, it, vi } from "vitest";
import {
  Action2Error,
  MIROIR_CACHE_SEGMENT_MARKER,
  PARTIAL_MUTATION_REJECTED_MESSAGE,
  ReportQueryLoadService,
  attributesFromResolvedReportQueryExtractors,
  createReportQueryLoadExecutor,
  createSegmentHeaderLookupFromLocalCacheSnapshot,
  getReduxDeploymentsStateIndex,
  isReportQueryLoadSegmentSufficient,
  resolveEntitiesToFetchOnRefresh,
  resolveReportQueryLoadAttributes,
  type ApplicationDeploymentMap,
  type Entity,
  type EntityDefinition,
  type EntityInstance,
  type InstanceAction,
  type ReportQueryLoadRequest,
} from "miroir-core";
import {
  entityBlob,
  entityDefinitionBlob,
  reportBlobList,
} from "miroir-test-app_deployment-miroir";

import { LocalCache } from "../src/index.js";

const APP = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const DEPLOY = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const BLOB = entityBlob.uuid as string;
const BLOB_PROJECTION = ["defaultLabel", "name", "uuid"]; // canonical sort

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [APP]: DEPLOY,
};

const fullIndex = getReduxDeploymentsStateIndex(DEPLOY, "data", BLOB, "full");
const partialIndex = getReduxDeploymentsStateIndex(DEPLOY, "data", BLOB, "partial");

function blobListResolvedQuery(withProjection: boolean) {
  return {
    queryType: "boxedQueryWithExtractorCombinerTransformer" as const,
    application: APP,
    extractors: {
      blobs: {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: BLOB,
        ...(withProjection
          ? { attributes: ["name", "defaultLabel", "uuid"] }
          : {}),
      },
    },
  };
}

function blobListRequest(
  overrides: Partial<ReportQueryLoadRequest> = {}
): ReportQueryLoadRequest {
  const resolvedQuery = blobListResolvedQuery(true);
  const base: ReportQueryLoadRequest = {
    application: APP,
    deploymentUuid: DEPLOY,
    reportUuid: reportBlobList?.uuid ?? "be61481c-644a-4f09-8c4f-581044e98956",
    applicationSection: "data",
    resolvedQuery,
    queryParams: {},
  };
  const attrs = resolveReportQueryLoadAttributes(base);
  return {
    ...base,
    ...(attrs?.length ? { projection: { attributes: attrs } } : {}),
    ...overrides,
  };
}

describe("214 Phase 5 — Blob partial-fetch tracer", () => {
  it("5.1 Blob is the tracer: lazy refresh + viewAttributes without contents", () => {
    expect(entityDefinitionBlob.cache?.cacheAllInstancesOnRefresh).toBe(false);
    expect(entityDefinitionBlob.viewAttributes).toEqual([
      "name",
      "defaultLabel",
      "uuid",
    ]);
    expect(entityDefinitionBlob.viewAttributes).not.toContain("contents");
    expect(reportBlobList?.definition?.extractorTemplates?.blobs?.parentUuid).toBe(
      BLOB
    );
    expect(
      reportBlobList?.definition?.extractorTemplates?.blobs?.attributes
    ).toEqual(["name", "defaultLabel", "uuid"]);
  });

  it("5.2.1 refresh does not stage-C full Blob (#114)", () => {
    const included = resolveEntitiesToFetchOnRefresh(
      [],
      [entityBlob as Entity],
      { [BLOB]: entityDefinitionBlob as EntityDefinition }
    );
    expect(included.map((e) => e.entity.uuid)).not.toContain(BLOB);
  });

  it("5.1 extractor attributes derive the same projection as BlobList", () => {
    const derived = attributesFromResolvedReportQueryExtractors(
      blobListResolvedQuery(true)
    );
    expect(derived).toEqual(BLOB_PROJECTION);
    expect(
      resolveReportQueryLoadAttributes({
        resolvedQuery: blobListResolvedQuery(true),
      })
    ).toEqual(BLOB_PROJECTION);
  });

  it("5.2 projected Blob list load fills partial segment fresh without contents", async () => {
    const localCache = new LocalCache();
    const handlePersistenceAction = vi.fn(async () => ({
      status: "ok" as const,
      returnedDomainElement: {
        parentUuid: BLOB,
        applicationSection: "data",
        instances: [
          {
            uuid: "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c",
            parentUuid: BLOB,
            name: "miroir-logo",
            defaultLabel: "Miroir Logo",
            // server would omit contents under projection; assert we never require it
          },
        ],
      },
    }));
    const domainController = {
      getRemoteStore: () => ({
        handlePersistenceAction,
        handleLocalCacheAction: (action: any, map: any) =>
          localCache.handleLocalCacheAction(action, map),
      }),
      getLocalCache: () => localCache,
    } as any;

    const executor = createReportQueryLoadExecutor(
      domainController,
      applicationDeploymentMap
    );
    const service = new ReportQueryLoadService(executor, {
      isSegmentSufficient: (request) =>
        isReportQueryLoadSegmentSufficient(
          request,
          createSegmentHeaderLookupFromLocalCacheSnapshot(
            localCache.getState().presentModelSnapshot
          )
        ),
    });

    const request = blobListRequest();
    await expect(service.ensureLoaded(request)).resolves.toBe("ready");
    expect(handlePersistenceAction).toHaveBeenCalledTimes(1);
    expect(handlePersistenceAction.mock.calls[0][0]).toMatchObject({
      actionType: "RestPersistenceAction_read",
      payload: { parentUuid: BLOB, attributes: BLOB_PROJECTION },
    });

    const snap = localCache.getState().presentModelSnapshot;
    expect(snap.current[partialIndex]?.segment).toEqual({
      kind: "partial",
      freshness: "fresh",
      projection: BLOB_PROJECTION,
    });
    const row = snap.current[partialIndex]?.entities?.[
      "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c"
    ] as EntityInstance;
    expect(row).toMatchObject({
      name: "miroir-logo",
      defaultLabel: "Miroir Logo",
    });
    expect(row).not.toHaveProperty("contents");
    expect(snap.current[fullIndex]).toBeUndefined();

    // 5.2.3 remount / same fingerprint → no second network
    await expect(service.ensureLoaded(request)).resolves.toBe("ready");
    expect(handlePersistenceAction).toHaveBeenCalledTimes(1);

    // 5.2.4 forceRefresh → exactly one new read
    await expect(
      service.ensureLoaded({ ...request, forceRefresh: true })
    ).resolves.toBe("ready");
    expect(handlePersistenceAction).toHaveBeenCalledTimes(2);
  });

  it("5.2 query without attributes targets full segment only", async () => {
    const localCache = new LocalCache();
    // Pre-fill partial so a buggy full path might accidentally read it
    localCache.handleLocalCacheAction(
      {
        actionType: "loadNewInstancesInLocalCache",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: APP,
          objects: [
            {
              parentUuid: BLOB,
              applicationSection: "data",
              attributes: BLOB_PROJECTION,
              instances: [
                {
                  uuid: "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c",
                  parentUuid: BLOB,
                  name: "from-partial",
                } as EntityInstance,
              ],
            },
          ],
        },
      } as InstanceAction,
      applicationDeploymentMap
    );

    const handlePersistenceAction = vi.fn(async () => ({
      status: "ok" as const,
      returnedDomainElement: {
        parentUuid: BLOB,
        applicationSection: "data",
        instances: [
          {
            uuid: "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c",
            parentUuid: BLOB,
            name: "full-blob",
            contents: { encoding: "base64", data: "AAAA" },
          },
        ],
      },
    }));
    const domainController = {
      getRemoteStore: () => ({
        handlePersistenceAction,
        handleLocalCacheAction: (action: any, map: any) =>
          localCache.handleLocalCacheAction(action, map),
      }),
    } as any;

    const executor = createReportQueryLoadExecutor(
      domainController,
      applicationDeploymentMap
    );
    await executor({
      application: APP,
      deploymentUuid: DEPLOY,
      applicationSection: "data",
      resolvedQuery: blobListResolvedQuery(false),
      queryParams: {},
    });

    expect(handlePersistenceAction.mock.calls[0][0].payload.attributes).toBeUndefined();
    const snap = localCache.getState().presentModelSnapshot;
    expect(snap.current[fullIndex]?.segment?.kind).toBe("full");
    expect(
      (snap.current[fullIndex]?.entities as any)?.[
        "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c"
      ]
    ).toMatchObject({ name: "full-blob", contents: expect.anything() });
    // partial sibling unchanged (not silently used for full query)
    expect(snap.current[partialIndex]?.entities).toBeDefined();
    expect(
      (snap.current[partialIndex]?.entities as any)?.[
        "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c"
      ]?.name
    ).toBe("from-partial");
  });

  it("5.2 updateInstance with partial payload is rejected", () => {
    const localCache = new LocalCache();
    const result = localCache.handleLocalCacheAction(
      {
        actionType: "updateInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: APP,
          applicationSection: "data",
          objects: [
            {
              uuid: "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c",
              parentUuid: BLOB,
              name: "nope",
              [MIROIR_CACHE_SEGMENT_MARKER]: "partial",
            } as EntityInstance,
          ],
        },
      },
      applicationDeploymentMap
    );
    expect(result).toMatchObject({
      status: "error",
      errorMessage: PARTIAL_MUTATION_REJECTED_MESSAGE,
    });
    expect(result).toBeInstanceOf(Action2Error);
  });
});
