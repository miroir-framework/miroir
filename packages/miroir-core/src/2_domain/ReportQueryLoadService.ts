import stringify from "fast-json-stable-stringify";

import type { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import type { BoxedQueryWithExtractorCombinerTransformer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  resolveReportQueryLoadAttributes,
  resolveReportQueryLoadSegmentKind,
} from "../1_core/reportQueryLoadSegment.js";

export type ReportLoadStatus = "idle" | "loading" | "ready" | "error";

export interface ReportQueryLoadRequest {
  application: Uuid;
  deploymentUuid: Uuid;
  reportUuid?: Uuid;
  /** Section used for RestPersistenceAction_read / cache fill (model vs data). */
  applicationSection?: "data" | "model";
  resolvedQuery: BoxedQueryWithExtractorCombinerTransformer | Record<string, unknown>;
  queryParams?: Record<string, unknown>;
  /**
   * #214 — when set, projected read + write/replace partial segment.
   * Fingerprint includes segment kind + canonical projection (not forceRefresh).
   */
  projection?: { attributes: string[] };
  /** #214 — bypass segment sufficiency and service ready short-circuit once. */
  forceRefresh?: boolean;
}

/**
 * Executes the actual persistence / cache write for a report query load.
 * Resolves on success; rejects (or throws) on failure.
 * Injected so the service stays unit-testable at the public boundary.
 */
export type ReportQueryLoadExecutor = (
  request: ReportQueryLoadRequest,
) => Promise<void>;

/** Optional #214 probe: true ⇒ skip network (segment already sufficient). */
export type ReportQueryLoadSegmentSufficiencyProbe = (
  request: ReportQueryLoadRequest,
) => boolean;

export type ReportQueryLoadServiceOptions = {
  isSegmentSufficient?: ReportQueryLoadSegmentSufficiencyProbe;
};

export function fingerprintReportQueryLoadRequest(
  request: ReportQueryLoadRequest,
): string {
  const projection = resolveReportQueryLoadAttributes(request) ?? null;
  return stringify({
    application: request.application,
    deploymentUuid: request.deploymentUuid,
    reportUuid: request.reportUuid ?? null,
    applicationSection: request.applicationSection ?? "data",
    resolvedQuery: request.resolvedQuery,
    queryParams: request.queryParams ?? {},
    // #214 Phase 3.1 — segment routing in fingerprint (forceRefresh excluded)
    segment: resolveReportQueryLoadSegmentKind(request),
    projection,
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
  private readonly isSegmentSufficient?: ReportQueryLoadSegmentSufficiencyProbe;

  constructor(
    private readonly executeLoad: ReportQueryLoadExecutor,
    options?: ReportQueryLoadServiceOptions,
  ) {
    this.isSegmentSufficient = options?.isSegmentSufficient;
  }

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
   * share one in-flight promise. Ready keys short-circuit unless forceRefresh
   * or segment sufficiency fails (#214). Error keys stay sticky until invalidate.
   */
  ensureLoaded(request: ReportQueryLoadRequest): Promise<ReportLoadStatus> {
    const key = this.fingerprint(request);

    if (request.forceRefresh) {
      this.invalidate(key);
    }

    if (!request.forceRefresh && this.isSegmentSufficient) {
      if (this.isSegmentSufficient(request)) {
        this.statusByKey.set(key, "ready");
        this.errorByKey.delete(key);
        return Promise.resolve("ready");
      }
      // Segment insufficient (stale / missing / projection mismatch): drop sticky ready.
      if (this.getStatus(key) === "ready") {
        this.statusByKey.delete(key);
      }
    } else if (this.getStatus(key) === "ready") {
      return Promise.resolve("ready");
    }

    if (this.getStatus(key) === "error") {
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
