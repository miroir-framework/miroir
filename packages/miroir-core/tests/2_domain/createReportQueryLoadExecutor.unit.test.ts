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

describe("createReportQueryLoadExecutor (Phase 4)", () => {
  it("extracts parentUuids from extractorInstancesByEntity", () => {
    expect(parentUuidsFromResolvedReportQuery(blobListRequest().resolvedQuery)).toEqual([
      BLOB_UUID,
    ]);
  });

  it("reads each parentUuid once then loadNewInstancesInLocalCache (4.1)", async () => {
    const handlePersistenceAction = vi.fn(async () => ({
      status: "ok" as const,
      returnedDomainElement: {
        parentUuid: BLOB_UUID,
        applicationSection: "data",
        instances: [{ uuid: "dddddddd-dddd-dddd-dddd-dddddddddddd", parentUuid: BLOB_UUID }],
      },
    }));
    const handleAction = vi.fn(async () => ({
      status: "ok" as const,
      returnedDomainElement: undefined,
    }));
    const domainController = {
      getRemoteStore: () => ({ handlePersistenceAction }),
      handleAction,
    } as any;

    const executor = createReportQueryLoadExecutor(domainController, {});
    await executor(blobListRequest());

    expect(handlePersistenceAction).toHaveBeenCalledTimes(1);
    expect(handlePersistenceAction.mock.calls[0][0]).toMatchObject({
      actionType: "RestPersistenceAction_read",
      payload: { parentUuid: BLOB_UUID, section: "data", application: APP },
    });
    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(handleAction.mock.calls[0][0]).toMatchObject({
      actionType: "loadNewInstancesInLocalCache",
    });
  });

  it("does nothing when resolved query has no entity extractors", async () => {
    const handlePersistenceAction = vi.fn();
    const handleAction = vi.fn();
    const domainController = {
      getRemoteStore: () => ({ handlePersistenceAction }),
      handleAction,
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
    expect(handleAction).not.toHaveBeenCalled();
  });
});
