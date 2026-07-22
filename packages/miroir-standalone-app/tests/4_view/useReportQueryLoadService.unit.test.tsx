import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  ReportQueryLoadRequest,
} from "miroir-core";

import { useEnsureReportQueryLoaded } from "../../src/miroir-fwk/4_view/components/Reports/useEnsureReportQueryLoaded.js";
import { useReportQueryLoadService } from "../../src/miroir-fwk/4_view/components/Reports/useReportQueryLoadService.js";

function stubDomainController(): DomainControllerInterface {
  return {
    getRemoteStore: () => ({
      handlePersistenceAction: vi.fn(async () => ({
        status: "ok",
        returnedDomainElement: { parentUuid: "62209e4a-e429-4d7d-9b28-dcc1da6b51a2", instances: [] },
      })),
      handleLocalCacheAction: vi.fn(() => ({ status: "ok" })),
    }),
  } as unknown as DomainControllerInterface;
}

function baseRequest(): ReportQueryLoadRequest {
  return {
    application: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    deploymentUuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    reportUuid: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    resolvedQuery: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      extractors: {
        blobs: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          parentUuid: "62209e4a-e429-4d7d-9b28-dcc1da6b51a2",
        },
      },
    },
    queryParams: {},
  };
}

describe("useReportQueryLoadService", () => {
  it("keeps one service instance across applicationDeploymentMap identity churn", () => {
    const domainController = stubDomainController();
    const mapA: ApplicationDeploymentMap = {
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    };
    const mapB: ApplicationDeploymentMap = {
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    };

    const { result, rerender } = renderHook(
      ({ map }) => useReportQueryLoadService(domainController, map),
      { initialProps: { map: mapA } },
    );
    const first = result.current;

    rerender({ map: mapB });
    expect(result.current).toBe(first);
  });

  it("does not re-enter loading when map identity changes after ready", async () => {
    const domainController = stubDomainController();
    const mapA: ApplicationDeploymentMap = {
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    };
    const mapB: ApplicationDeploymentMap = { ...mapA };
    const request = baseRequest();

    const { result, rerender } = renderHook(
      ({ map }) => {
        const service = useReportQueryLoadService(domainController, map);
        return useEnsureReportQueryLoaded(service, request);
      },
      { initialProps: { map: mapA } },
    );

    await waitFor(() => expect(result.current).toBe("ready"));

    await act(async () => {
      rerender({ map: mapB });
    });

    expect(result.current).toBe("ready");
  });
});
