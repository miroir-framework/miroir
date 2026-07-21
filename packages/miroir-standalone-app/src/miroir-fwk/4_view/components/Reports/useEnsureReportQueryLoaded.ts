import { useEffect, useRef, useState } from "react";

import type {
  ReportLoadStatus,
  ReportQueryLoadRequest,
  ReportQueryLoadService,
} from "miroir-core";

/**
 * Effect-driven report query load. Render only observes status; ensureLoaded
 * runs in an effect keyed by fingerprint (not by request object identity).
 */
export function useEnsureReportQueryLoaded(
  service: ReportQueryLoadService | undefined,
  request: ReportQueryLoadRequest | undefined,
): ReportLoadStatus {
  const fingerprint =
    service && request ? service.fingerprint(request) : undefined;

  const requestRef = useRef(request);
  requestRef.current = request;

  const [status, setStatus] = useState<ReportLoadStatus>(() =>
    service && fingerprint ? service.getStatus(fingerprint) : "idle",
  );

  useEffect(() => {
    if (!service || !fingerprint) {
      setStatus("idle");
      return;
    }

    const currentRequest = requestRef.current;
    if (!currentRequest) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    // ensureLoaded sets service status to loading synchronously before returning
    // the in-flight promise; read it after the call so the hook exposes loading.
    const loadPromise = service.ensureLoaded(currentRequest);
    setStatus(service.getStatus(fingerprint));

    void loadPromise.then((next) => {
      if (!cancelled) {
        setStatus(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [service, fingerprint]);

  return status;
}
