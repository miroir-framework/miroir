import stringify from "fast-json-stable-stringify";

import type { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import type { BoxedQueryWithExtractorCombinerTransformer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

export type ReportLoadStatus = "idle" | "loading" | "ready" | "error";

export interface ReportQueryLoadRequest {
  application: Uuid;
  deploymentUuid: Uuid;
  reportUuid?: Uuid;
  resolvedQuery: BoxedQueryWithExtractorCombinerTransformer | Record<string, unknown>;
  queryParams?: Record<string, unknown>;
}

/**
 * Executes the actual persistence / cache write for a report query load.
 * Resolves on success; rejects (or throws) on failure.
 * Injected so the service stays unit-testable at the public boundary.
 */
export type ReportQueryLoadExecutor = (
  request: ReportQueryLoadRequest,
) => Promise<void>;

export function fingerprintReportQueryLoadRequest(
  request: ReportQueryLoadRequest,
): string {
  return stringify({
    application: request.application,
    deploymentUuid: request.deploymentUuid,
    reportUuid: request.reportUuid ?? null,
    resolvedQuery: request.resolvedQuery,
    queryParams: request.queryParams ?? {},
  });
}

/**
 * Single-flight async report query loader.
 * Render must not call ensureLoaded — only an effect / non-React caller.
 */
export class ReportQueryLoadService {
  private readonly statusByKey = new Map<string, ReportLoadStatus>();
  private readonly errorByKey = new Map<string, unknown>();
  private readonly inFlightByKey = new Map<string, Promise<ReportLoadStatus>>();

  constructor(private readonly executeLoad: ReportQueryLoadExecutor) {}

  fingerprint(request: ReportQueryLoadRequest): string {
    return fingerprintReportQueryLoadRequest(request);
  }

  getStatus(key: string): ReportLoadStatus {
    return this.statusByKey.get(key) ?? "idle";
  }

  getError(key: string): unknown | undefined {
    return this.errorByKey.get(key);
  }

  /**
   * Ensures the request is loaded. Concurrent calls with the same fingerprint
   * share one in-flight promise. Ready keys short-circuit. Error keys stay sticky
   * (no automatic re-dispatch) until invalidate.
   */
  ensureLoaded(request: ReportQueryLoadRequest): Promise<ReportLoadStatus> {
    const key = this.fingerprint(request);
    const current = this.getStatus(key);

    if (current === "ready") {
      return Promise.resolve("ready");
    }
    if (current === "error") {
      return Promise.resolve("error");
    }

    const existing = this.inFlightByKey.get(key);
    if (existing) {
      return existing;
    }

    this.statusByKey.set(key, "loading");
    this.errorByKey.delete(key);

    const promise = this.executeLoad(request)
      .then((): ReportLoadStatus => {
        this.statusByKey.set(key, "ready");
        this.errorByKey.delete(key);
        return "ready";
      })
      .catch((error: unknown): ReportLoadStatus => {
        this.statusByKey.set(key, "error");
        this.errorByKey.set(key, error);
        return "error";
      })
      .finally(() => {
        this.inFlightByKey.delete(key);
      });

    this.inFlightByKey.set(key, promise);
    return promise;
  }

  /** Clears status / error / in-flight for a key so a later ensureLoaded may re-dispatch. */
  invalidate(key: string): void {
    this.statusByKey.delete(key);
    this.errorByKey.delete(key);
    this.inFlightByKey.delete(key);
  }
}
