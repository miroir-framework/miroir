import { describe, expect, it, vi } from "vitest";

import {
  ReportQueryLoadService,
  fingerprintReportQueryLoadRequest,
  type ReportQueryLoadRequest,
} from "../../src/2_domain/ReportQueryLoadService.js";

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

describe("fingerprintReportQueryLoadRequest (2.1)", () => {
  it("returns the same key for logically identical requests", () => {
    const a = baseRequest({ queryParams: { z: 1, a: 2 } });
    const b = baseRequest({ queryParams: { a: 2, z: 1 } });
    expect(fingerprintReportQueryLoadRequest(a)).toBe(fingerprintReportQueryLoadRequest(b));
  });

  it("changes when queryParams change", () => {
    const a = baseRequest({ queryParams: { filter: "x" } });
    const b = baseRequest({ queryParams: { filter: "y" } });
    expect(fingerprintReportQueryLoadRequest(a)).not.toBe(
      fingerprintReportQueryLoadRequest(b),
    );
  });

  it("changes when resolvedQuery extractors change", () => {
    const a = baseRequest();
    const b = baseRequest({
      resolvedQuery: {
        ...a.resolvedQuery,
        extractors: {
          other: {
            extractorOrCombinerType: "extractorInstancesByEntity",
            parentUuid: "11111111-1111-1111-1111-111111111111",
          },
        },
      },
    });
    expect(fingerprintReportQueryLoadRequest(a)).not.toBe(
      fingerprintReportQueryLoadRequest(b),
    );
  });

  it("changes when reportUuid or deploymentUuid changes", () => {
    const a = baseRequest();
    expect(fingerprintReportQueryLoadRequest(a)).not.toBe(
      fingerprintReportQueryLoadRequest(
        baseRequest({ reportUuid: "dddddddd-dddd-dddd-dddd-dddddddddddd" }),
      ),
    );
    expect(fingerprintReportQueryLoadRequest(a)).not.toBe(
      fingerprintReportQueryLoadRequest(
        baseRequest({ deploymentUuid: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee" }),
      ),
    );
  });

  it("fingerprint changes when projection attributes change (3.1)", () => {
    const a = baseRequest();
    const b = baseRequest({ projection: { attributes: ["name", "uuid"] } });
    const c = baseRequest({ projection: { attributes: ["uuid", "name"] } });
    expect(fingerprintReportQueryLoadRequest(a)).not.toBe(
      fingerprintReportQueryLoadRequest(b),
    );
    // canonical order — same projection set ⇒ same fingerprint
    expect(fingerprintReportQueryLoadRequest(b)).toBe(
      fingerprintReportQueryLoadRequest(c),
    );
  });

  it("fingerprint ignores forceRefresh (3.1)", () => {
    const a = baseRequest();
    const b = baseRequest({ forceRefresh: true });
    expect(fingerprintReportQueryLoadRequest(a)).toBe(
      fingerprintReportQueryLoadRequest(b),
    );
  });
});

describe("ReportQueryLoadService ensureLoaded (2.2–2.5)", () => {
  it("shares one executor call for concurrent ensureLoaded with the same key (2.2)", async () => {
    let resolveLoad!: () => void;
    const loadPromise = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });
    const executeLoad = vi.fn(() => loadPromise);
    const service = new ReportQueryLoadService(executeLoad);
    const request = baseRequest();

    const p1 = service.ensureLoaded(request);
    const p2 = service.ensureLoaded(request);
    expect(service.getStatus(service.fingerprint(request))).toBe("loading");
    expect(executeLoad).toHaveBeenCalledTimes(1);

    resolveLoad();
    await expect(Promise.all([p1, p2])).resolves.toEqual(["ready", "ready"]);
    expect(executeLoad).toHaveBeenCalledTimes(1);
    expect(service.getStatus(service.fingerprint(request))).toBe("ready");
  });

  it("does not re-dispatch after status is ready (2.3)", async () => {
    const executeLoad = vi.fn(async () => undefined);
    const service = new ReportQueryLoadService(executeLoad);
    const request = baseRequest();

    await expect(service.ensureLoaded(request)).resolves.toBe("ready");
    await expect(service.ensureLoaded(request)).resolves.toBe("ready");
    expect(executeLoad).toHaveBeenCalledTimes(1);
  });

  it("dispatches again when fingerprint changes (2.4)", async () => {
    const executeLoad = vi.fn(async () => undefined);
    const service = new ReportQueryLoadService(executeLoad);

    await service.ensureLoaded(baseRequest({ queryParams: { filter: "a" } }));
    await service.ensureLoaded(baseRequest({ queryParams: { filter: "b" } }));
    expect(executeLoad).toHaveBeenCalledTimes(2);
  });

  it("on success exposes ready status (executor owns cache write) (2.5)", async () => {
    const cacheWrites: string[] = [];
    const executeLoad = vi.fn(async (request: ReportQueryLoadRequest) => {
      cacheWrites.push(request.reportUuid ?? "");
    });
    const service = new ReportQueryLoadService(executeLoad);
    const request = baseRequest();

    await expect(service.ensureLoaded(request)).resolves.toBe("ready");
    expect(cacheWrites).toEqual([request.reportUuid]);
    expect(service.getError(service.fingerprint(request))).toBeUndefined();
  });

  it("on failure sets sticky error and does not re-dispatch until invalidate (2.5)", async () => {
    const executeLoad = vi.fn(async () => {
      throw new Error("persistence failed");
    });
    const service = new ReportQueryLoadService(executeLoad);
    const request = baseRequest();
    const key = service.fingerprint(request);

    await expect(service.ensureLoaded(request)).resolves.toBe("error");
    expect(service.getStatus(key)).toBe("error");
    expect(String(service.getError(key))).toContain("persistence failed");

    await expect(service.ensureLoaded(request)).resolves.toBe("error");
    expect(executeLoad).toHaveBeenCalledTimes(1);

    service.invalidate(key);
    expect(service.getStatus(key)).toBe("idle");

    await expect(service.ensureLoaded(request)).resolves.toBe("error");
    expect(executeLoad).toHaveBeenCalledTimes(2);
  });
});

describe("ReportQueryLoadService segment sufficiency (3.3–3.4)", () => {
  it("ensureLoaded does not call executor when segment probe is sufficient (3.3)", async () => {
    const executeLoad = vi.fn(async () => undefined);
    const service = new ReportQueryLoadService(executeLoad, {
      isSegmentSufficient: () => true,
    });
    const request = baseRequest({ projection: { attributes: ["name"] } });

    await expect(service.ensureLoaded(request)).resolves.toBe("ready");
    await expect(service.ensureLoaded(request)).resolves.toBe("ready");
    expect(executeLoad).not.toHaveBeenCalled();
  });

  it("ensureLoaded calls executor when partial projection mismatches (3.3)", async () => {
    const executeLoad = vi.fn(async () => undefined);
    const service = new ReportQueryLoadService(executeLoad, {
      isSegmentSufficient: () => false,
    });
    await expect(
      service.ensureLoaded(baseRequest({ projection: { attributes: ["name"] } })),
    ).resolves.toBe("ready");
    expect(executeLoad).toHaveBeenCalledTimes(1);
  });

  it("ensureLoaded refetches when segment becomes insufficient after ready (3.4 stale)", async () => {
    let sufficient = true;
    const executeLoad = vi.fn(async () => undefined);
    const service = new ReportQueryLoadService(executeLoad, {
      isSegmentSufficient: () => sufficient,
    });
    const request = baseRequest();

    await service.ensureLoaded(request);
    expect(executeLoad).toHaveBeenCalledTimes(0);

    sufficient = false;
    await service.ensureLoaded(request);
    expect(executeLoad).toHaveBeenCalledTimes(1);
  });

  it("ensureLoaded refetches once when forceRefresh is set (3.4)", async () => {
    const executeLoad = vi.fn(async () => undefined);
    const service = new ReportQueryLoadService(executeLoad, {
      isSegmentSufficient: () => true,
    });
    const request = baseRequest();

    await service.ensureLoaded(request);
    expect(executeLoad).toHaveBeenCalledTimes(0);

    await service.ensureLoaded({ ...request, forceRefresh: true });
    expect(executeLoad).toHaveBeenCalledTimes(1);

    // without forceRefresh, sufficiency still skips
    await service.ensureLoaded(request);
    expect(executeLoad).toHaveBeenCalledTimes(1);
  });

  it("concurrent ensureLoaded after stale share one executor call (3.4 single-flight)", async () => {
    let resolveLoad!: () => void;
    const loadPromise = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });
    const executeLoad = vi.fn(() => loadPromise);
    let sufficient = false;
    const service = new ReportQueryLoadService(executeLoad, {
      isSegmentSufficient: () => sufficient,
    });
    const request = baseRequest();

    const p1 = service.ensureLoaded(request);
    const p2 = service.ensureLoaded(request);
    expect(executeLoad).toHaveBeenCalledTimes(1);
    resolveLoad();
    await expect(Promise.all([p1, p2])).resolves.toEqual(["ready", "ready"]);
    expect(executeLoad).toHaveBeenCalledTimes(1);
  });
});
