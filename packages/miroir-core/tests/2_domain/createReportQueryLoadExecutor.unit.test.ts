import { describe, expect, it, vi } from "vitest";

import {
  createReportQueryLoadExecutor,
  parentUuidsFromResolvedReportQuery,
} from "../../src/2_domain/createReportQueryLoadExecutor.js";
import { reportQueryLoadTargetsFromResolvedReportQuery } from "../../src/1_core/localCache/reportQueryLoadSegment.js";
import type { ReportQueryLoadRequest } from "../../src/2_domain/ReportQueryLoadService.js";

const BLOB_UUID = "62209e4a-e429-4d7d-9b28-dcc1da6b51a2";
const APP = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const DEPLOY = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function blobListRequest(): ReportQueryLoadRequest {
  return {
    application: APP,
    deploymentUuid: DEPLOY,
    reportUuid: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    resolvedQuery: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: APP,
      extractors: {
        blobs: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          parentUuid: BLOB_UUID,
        },
      },
    },
    queryParams: {},
  };
}

function firstCallArg<T>(fn: { mock: { calls: unknown[][] } }): T {
  const args = fn.mock.calls[0];
  if (!args || args.length === 0) {
    throw new Error("expected mock to have been called with at least one argument");
  }
  return args[0] as T;
}

const INSTANCE = "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c";

function blobDetailsRequest(): ReportQueryLoadRequest {
  return {
    application: APP,
    deploymentUuid: DEPLOY,
    reportUuid: "5a90a36c-f167-44f3-812f-3a70772e0a58",
    applicationSection: "data",
    resolvedQuery: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: APP,
      extractors: {
        blob: {
          extractorOrCombinerType: "extractorByPrimaryKey",
          parentUuid: BLOB_UUID,
          instanceUuid: INSTANCE,
        },
      },
    },
    queryParams: {},
  };
}

describe("createReportQueryLoadExecutor (Phase 4)", () => {
  it("extracts parentUuids from extractorInstancesByEntity", () => {
    expect(parentUuidsFromResolvedReportQuery(blobListRequest().resolvedQuery)).toEqual([
      BLOB_UUID,
    ]);
  });

  it("extracts load targets from extractorByPrimaryKey (#214 BlobDetails)", () => {
    expect(
      reportQueryLoadTargetsFromResolvedReportQuery(blobDetailsRequest().resolvedQuery)
    ).toEqual([
      {
        parentUuid: BLOB_UUID,
        instanceUuid: INSTANCE,
        extractorKey: "blob",
      },
    ]);
    expect(parentUuidsFromResolvedReportQuery(blobDetailsRequest().resolvedQuery)).toEqual([
      BLOB_UUID,
    ]);
  });

  it("reads each parentUuid once then loadNewInstancesInLocalCache via local cache (4.1)", async () => {
    const handlePersistenceAction = vi.fn(async (_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: {
        parentUuid: BLOB_UUID,
        applicationSection: "data",
        instances: [{ uuid: "dddddddd-dddd-dddd-dddd-dddddddddddd", parentUuid: BLOB_UUID }],
      },
    }));
    const handleLocalCacheAction = vi.fn((_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: undefined,
    }));
    const domainController = {
      getRemoteStore: () => ({ handlePersistenceAction, handleLocalCacheAction }),
    } as any;

    const executor = createReportQueryLoadExecutor(domainController, {
      [APP]: DEPLOY,
    });
    await executor({ ...blobListRequest(), applicationSection: "data" });

    expect(handlePersistenceAction).toHaveBeenCalledTimes(1);
    expect(firstCallArg(handlePersistenceAction)).toMatchObject({
      actionType: "RestPersistenceAction_read",
      payload: { parentUuid: BLOB_UUID, section: "data", application: APP },
    });
    expect(handleLocalCacheAction).toHaveBeenCalledTimes(1);
    expect(firstCallArg(handleLocalCacheAction)).toMatchObject({
      actionType: "loadNewInstancesInLocalCache",
    });
  });

  it("uses request.applicationSection for model reports", async () => {
    const handlePersistenceAction = vi.fn(async (_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: {
        parentUuid: BLOB_UUID,
        applicationSection: "model",
        instances: [],
      },
    }));
    const handleLocalCacheAction = vi.fn((_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: undefined,
    }));
    const domainController = {
      getRemoteStore: () => ({ handlePersistenceAction, handleLocalCacheAction }),
    } as any;

    const executor = createReportQueryLoadExecutor(domainController, { [APP]: DEPLOY });
    await executor({ ...blobListRequest(), applicationSection: "model" });

    expect(
      (firstCallArg<{ payload: { section: string } }>(handlePersistenceAction)).payload.section,
    ).toBe("model");
  });

  it("does nothing when resolved query has no entity extractors", async () => {
    const handlePersistenceAction = vi.fn(async (_action: unknown, _map?: unknown) => undefined);
    const handleLocalCacheAction = vi.fn((_action: unknown, _map?: unknown) => undefined);
    const domainController = {
      getRemoteStore: () => ({ handlePersistenceAction, handleLocalCacheAction }),
    } as any;

    const executor = createReportQueryLoadExecutor(domainController, {});
    await executor({
      application: APP,
      deploymentUuid: DEPLOY,
      resolvedQuery: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: APP,
        extractors: {},
      },
    });

    expect(handlePersistenceAction).not.toHaveBeenCalled();
    expect(handleLocalCacheAction).not.toHaveBeenCalled();
  });

  it("with projection: RestPersistenceAction_read forwards attributes and load targets partial segment (3.2)", async () => {
    const handlePersistenceAction = vi.fn(async (_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: {
        parentUuid: BLOB_UUID,
        applicationSection: "data",
        instances: [{ uuid: "dddddddd-dddd-dddd-dddd-dddddddddddd", name: "x" }],
      },
    }));
    const handleLocalCacheAction = vi.fn((_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: undefined,
    }));
    const domainController = {
      getRemoteStore: () => ({ handlePersistenceAction, handleLocalCacheAction }),
    } as any;

    const executor = createReportQueryLoadExecutor(domainController, { [APP]: DEPLOY });
    await executor({
      ...blobListRequest(),
      applicationSection: "data",
      projection: { attributes: ["name", "uuid"] },
    });

    expect(firstCallArg(handlePersistenceAction)).toMatchObject({
      actionType: "RestPersistenceAction_read",
      payload: {
        parentUuid: BLOB_UUID,
        attributes: ["name", "uuid"],
      },
    });
    expect(firstCallArg(handleLocalCacheAction)).toMatchObject({
      actionType: "loadNewInstancesInLocalCache",
      payload: {
        objects: [
          {
            parentUuid: BLOB_UUID,
            cacheSegment: "partial",
            attributes: ["name", "uuid"],
          },
        ],
      },
    });
  });

  it("derives projection from extractor attributes when request.projection omitted (#214 Phase 5)", async () => {
    const handlePersistenceAction = vi.fn(async (_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: {
        parentUuid: BLOB_UUID,
        applicationSection: "data",
        instances: [],
      },
    }));
    const handleLocalCacheAction = vi.fn((_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: undefined,
    }));
    const domainController = {
      getRemoteStore: () => ({ handlePersistenceAction, handleLocalCacheAction }),
    } as any;

    const executor = createReportQueryLoadExecutor(domainController, { [APP]: DEPLOY });
    await executor({
      application: APP,
      deploymentUuid: DEPLOY,
      applicationSection: "data",
      resolvedQuery: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: APP,
        extractors: {
          blobs: {
            extractorOrCombinerType: "extractorInstancesByEntity",
            parentUuid: BLOB_UUID,
            attributes: ["name", "defaultLabel", "uuid"],
          },
        },
      },
      queryParams: {},
    });

    expect(firstCallArg(handlePersistenceAction)).toMatchObject({
      payload: {
        attributes: ["defaultLabel", "name", "uuid"],
      },
    });
    expect(firstCallArg(handleLocalCacheAction)).toMatchObject({
      payload: {
        objects: [
          {
            cacheSegment: "partial",
            attributes: ["defaultLabel", "name", "uuid"],
          },
        ],
      },
    });
  });

  it("without projection: load targets full segment only (3.2 non-regression)", async () => {
    const handlePersistenceAction = vi.fn(async (_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: {
        parentUuid: BLOB_UUID,
        applicationSection: "data",
        instances: [],
      },
    }));
    const handleLocalCacheAction = vi.fn((_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: undefined,
    }));
    const domainController = {
      getRemoteStore: () => ({ handlePersistenceAction, handleLocalCacheAction }),
    } as any;

    const executor = createReportQueryLoadExecutor(domainController, { [APP]: DEPLOY });
    await executor({ ...blobListRequest(), applicationSection: "data" });

    const readPayload = firstCallArg<{ payload: { attributes?: string[] } }>(
      handlePersistenceAction,
    ).payload;
    expect(readPayload.attributes).toBeUndefined();

    const loadObjects = firstCallArg<{
      payload: { objects: Array<{ cacheSegment?: string; attributes?: string[] }> };
    }>(handleLocalCacheAction).payload.objects;
    expect(loadObjects[0]).toMatchObject({ cacheSegment: "full" });
    expect(loadObjects[0]?.attributes).toBeUndefined();
  });

  it("extractorByPrimaryKey uses runBoxedQueryAction storage (#214 BlobDetails)", async () => {
    const handlePersistenceAction = vi.fn(async (action: any) => {
      if (action.actionType === "runBoxedQueryAction") {
        return {
          status: "ok" as const,
          returnedDomainElement: {
            blob: {
              uuid: INSTANCE,
              parentUuid: BLOB_UUID,
              name: "MiroirLogo",
              contents: { encoding: "base64", data: "AAAA" },
            },
          },
        };
      }
      return { status: "ok" as const, returnedDomainElement: { instances: [] } };
    });
    const handleLocalCacheAction = vi.fn((_action: unknown, _map?: unknown) => ({
      status: "ok" as const,
      returnedDomainElement: undefined,
    }));
    const domainController = {
      getRemoteStore: () => ({ handlePersistenceAction, handleLocalCacheAction }),
    } as any;

    const executor = createReportQueryLoadExecutor(domainController, { [APP]: DEPLOY });
    await executor(blobDetailsRequest());

    expect(handlePersistenceAction).toHaveBeenCalledTimes(1);
    expect(firstCallArg(handlePersistenceAction)).toMatchObject({
      actionType: "runBoxedQueryAction",
      payload: {
        queryExecutionStrategy: "storage",
        query: {
          extractors: {
            blob: {
              extractorOrCombinerType: "extractorByPrimaryKey",
              parentUuid: BLOB_UUID,
              instanceUuid: INSTANCE,
            },
          },
        },
      },
    });
    expect(firstCallArg(handleLocalCacheAction)).toMatchObject({
      payload: {
        objects: [
          {
            parentUuid: BLOB_UUID,
            cacheSegment: "full",
            instances: [{ uuid: INSTANCE, name: "MiroirLogo" }],
          },
        ],
      },
    });
  });
});
