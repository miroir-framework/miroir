import { useRef } from "react";

import {
  createReportQueryLoadExecutor,
  createSegmentHeaderLookupFromLocalCacheSnapshot,
  isReportQueryLoadSegmentSufficient,
  ReportQueryLoadService,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type ReportQueryLoadExecutor,
} from "miroir-core";

/**
 * Lifetime-stable ReportQueryLoadService for a report view.
 *
 * `applicationDeploymentMap` often gets a new object identity after every
 * LocalCache write (selector re-run → RootComponent rememoizes the map) even
 * when contents are unchanged. Recreating the service would wipe ready/error
 * status and re-enter "loading", flashing "Loading report data…" forever.
 *
 * The executor always reads the latest controller/map via a ref.
 */
export function useReportQueryLoadService(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): ReportQueryLoadService {
  const domainControllerRef = useRef(domainController);
  domainControllerRef.current = domainController;

  const executeLoadRef = useRef<ReportQueryLoadExecutor>(
    createReportQueryLoadExecutor(domainController, applicationDeploymentMap),
  );
  executeLoadRef.current = createReportQueryLoadExecutor(
    domainController,
    applicationDeploymentMap,
  );

  const serviceRef = useRef<ReportQueryLoadService | null>(null);
  if (!serviceRef.current) {
    serviceRef.current = new ReportQueryLoadService(
      (request) => executeLoadRef.current(request),
      {
        // #214 Phase 3.3 — skip network when local-cache segment already sufficient
        isSegmentSufficient: (request) => {
          try {
            const snap =
              domainControllerRef.current.getLocalCache().getState()
                ?.presentModelSnapshot;
            if (!snap) return false;
            return isReportQueryLoadSegmentSufficient(
              request,
              createSegmentHeaderLookupFromLocalCacheSnapshot(snap),
            );
          } catch {
            return false;
          }
        },
      },
    );
  }
  return serviceRef.current;
}
