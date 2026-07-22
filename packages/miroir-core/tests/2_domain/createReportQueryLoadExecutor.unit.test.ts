import { describe, expect, it, vi } from "vitest";

import {
  createReportQueryLoadExecutor,
  parentUuidsFromResolvedReportQuery,
} from "../../src/2_domain/createReportQueryLoadExecutor.js";
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

describe("createReportQueryLoadExecutor (Phase 4)", () => {
  it("extracts parentUuids from extractorInstancesByEntity", () => {
    expect(parentUuidsFromResolvedReportQuery(blobListRequest().resolvedQuery)).toEqual([
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
});
