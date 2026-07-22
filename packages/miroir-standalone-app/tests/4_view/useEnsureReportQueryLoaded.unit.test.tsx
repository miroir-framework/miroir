import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ReportQueryLoadService,
  type ReportQueryLoadRequest,
} from "../../../miroir-core/src/2_domain/ReportQueryLoadService.js";

import { useEnsureReportQueryLoaded } from "../../src/miroir-fwk/4_view/components/Reports/useEnsureReportQueryLoaded.js";

function baseRequest(
  overrides: Partial<ReportQueryLoadRequest> = {},
): ReportQueryLoadRequest {
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
    ...overrides,
  };
}

describe("useEnsureReportQueryLoaded (Phase 3)", () => {
  it("calls ensureLoaded once on mount for a request (3.1)", async () => {
    const executeLoad = vi.fn(async () => undefined);
    const service = new ReportQueryLoadService(executeLoad);
    const ensureSpy = vi.spyOn(service, "ensureLoaded");
    const request = baseRequest();

    const { result } = renderHook(() => useEnsureReportQueryLoaded(service, request));

    await waitFor(() => expect(result.current).toBe("ready"));
    expect(ensureSpy).toHaveBeenCalledTimes(1);
  });

  it("does not call ensureLoaded again on re-render with the same fingerprint (3.1–3.2)", async () => {
    const executeLoad = vi.fn(async () => undefined);
    const service = new ReportQueryLoadService(executeLoad);
    const ensureSpy = vi.spyOn(service, "ensureLoaded");
    const request = baseRequest();

    const { result, rerender } = renderHook(
      ({ req }) => useEnsureReportQueryLoaded(service, req),
      { initialProps: { req: request } },
    );

    await waitFor(() => expect(result.current).toBe("ready"));
    expect(ensureSpy).toHaveBeenCalledTimes(1);

    rerender({ req: { ...request } }); // new object, same fingerprint
    expect(ensureSpy).toHaveBeenCalledTimes(1);
    expect(result.current).toBe("ready");
  });

  it("calls ensureLoaded again when fingerprint changes (3.1)", async () => {
    const executeLoad = vi.fn(async () => undefined);
    const service = new ReportQueryLoadService(executeLoad);
    const ensureSpy = vi.spyOn(service, "ensureLoaded");

    const { result, rerender } = renderHook(
      ({ req }) => useEnsureReportQueryLoaded(service, req),
      { initialProps: { req: baseRequest({ queryParams: { filter: "a" } }) } },
    );

    await waitFor(() => expect(result.current).toBe("ready"));
    expect(ensureSpy).toHaveBeenCalledTimes(1);

    rerender({ req: baseRequest({ queryParams: { filter: "b" } }) });
    await waitFor(() => expect(ensureSpy).toHaveBeenCalledTimes(2));
    expect(result.current).toBe("ready");
  });

  it("exposes idle when request is undefined and does not call ensureLoaded (3.3)", () => {
    const executeLoad = vi.fn(async () => undefined);
    const service = new ReportQueryLoadService(executeLoad);
    const ensureSpy = vi.spyOn(service, "ensureLoaded");

    const { result } = renderHook(() => useEnsureReportQueryLoaded(service, undefined));

    expect(result.current).toBe("idle");
    expect(ensureSpy).not.toHaveBeenCalled();
  });

  it("transitions loading → ready (3.3)", async () => {
    let resolveLoad!: () => void;
    const loadPromise = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });
    const service = new ReportQueryLoadService(() => loadPromise);
    const request = baseRequest();

    const { result } = renderHook(() => useEnsureReportQueryLoaded(service, request));

    await waitFor(() => expect(result.current).toBe("loading"));

    await act(async () => {
      resolveLoad();
    });
    await waitFor(() => expect(result.current).toBe("ready"));
  });

  it("exposes sticky error across re-renders without re-dispatch (3.3)", async () => {
    const executeLoad = vi.fn(async () => {
      throw new Error("load failed");
    });
    const service = new ReportQueryLoadService(executeLoad);
    const ensureSpy = vi.spyOn(service, "ensureLoaded");
    const request = baseRequest();

    const { result, rerender } = renderHook(
      ({ req }) => useEnsureReportQueryLoaded(service, req),
      { initialProps: { req: request } },
    );

    await waitFor(() => expect(result.current).toBe("error"));
    expect(ensureSpy).toHaveBeenCalledTimes(1);

    rerender({ req: { ...request } });
    expect(result.current).toBe("error");
    expect(ensureSpy).toHaveBeenCalledTimes(1);
  });

  /**
   * Documents the list-report infinite-refresh loop: when ReportViewWithEditor
   * recreates ReportQueryLoadService because applicationDeploymentMap got a new
   * object identity (common after loadNewInstancesInLocalCache → Redux update →
   * RootComponent rememoizes the map), the hook treats it as a new load and
   * re-enters "loading" forever.
   */
  it("re-dispatches when the service instance is replaced after ready (loop cause)", async () => {
    const executeLoad = vi.fn(async () => undefined);
    const service1 = new ReportQueryLoadService(executeLoad);
    const request = baseRequest();

    const { result, rerender } = renderHook(
      ({ svc }) => useEnsureReportQueryLoaded(svc, request),
      { initialProps: { svc: service1 } },
    );

    await waitFor(() => expect(result.current).toBe("ready"));
    expect(executeLoad).toHaveBeenCalledTimes(1);

    const service2 = new ReportQueryLoadService(executeLoad);
    rerender({ svc: service2 });

    await waitFor(() => expect(executeLoad).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current).toBe("ready"));
  });
});
