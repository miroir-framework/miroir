import type { DomainControllerInterface, MiroirConfigClient } from "miroir-core";

import { META_DEPLOYMENT_UUID } from "./loadTimingConstants.js";
import {
  createLoadTimingRecorder,
  type LoadTimingNavigation,
  type LoadTimingRecorder,
} from "./loadTimingRecorder.js";
import { configurationListsDeployment, LOAD_TIMINGS_URL_PARAMETER, resolveLoadTimingsSwitch } from "./loadTimingSwitch.js";
import type { LoadTimingStep } from "./loadTimingTypes.js";

// ################################################################################################
// #580: feeds the load timing recorder from the browser. Imported first by index.tsx, so that the
// `entryScript` milestone is taken before the page's other modules run. Until the client
// configuration is known (configureLoadTimings), it only observes: Resource Timing (buffered by the
// browser from navigation start), DOM changes, fetch calls. Switched off, it stops observing and
// puts `fetch` back.
// No package imports but types: this module is loaded with the page. The writer, which imports
// miroir-core, is a dynamic import done at the first write.
// chunkLoadTrace.ts also observes resources, for its console trace of vendor chunks; it has its own
// switch (VITE_MIROIR_LOG_CHUNK_LOADS).
// ################################################################################################

declare global {
  interface Window {
    /** The finished load steps of the page session, for the DevTools console and browser tests. */
    __miroirLoadTimings?: LoadTimingStep[];
  }
}

const LOG_PREFIX = "[miroir-load-timing]";
/** Set on a loading placeholder (Suspense fallback): a step does not end while one is displayed. */
export const LOAD_TIMING_LOADING_ATTRIBUTE = "data-miroir-loading";
/** Set on a part of the page that changes on a timer (monitors): its changes are not page activity. */
export const LOAD_TIMING_IGNORE_ATTRIBUTE = "data-miroir-load-timing-ignore";

let recorder: LoadTimingRecorder | undefined;
const teardown: (() => void)[] = [];

function newUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // randomUUID needs a secure context; a page served over plain http on another host has none.
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.floor(Math.random() * 256) & (15 >> (Number(c) / 4)))).toString(16),
  );
}

function isIgnored(node: Node | null): boolean {
  const element = node instanceof Element ? node : node?.parentElement;
  return !!element?.closest(`[${LOAD_TIMING_IGNORE_ATTRIBUTE}]`);
}

function logStep(step: LoadTimingStep) {
  console.info(LOG_PREFIX, `${step.step} (${step.page}): ${step.durationMs} ms${step.settled ? "" : ", not settled"}`, {
    chunks: step.chunkCount,
    chunkTransferBytes: step.chunkTransferBytes,
    dataRequests: step.dataRequestCount,
    milestones: step.milestones,
    files: step.chunks.map((chunk) => chunk.file),
  });
}

function startObserving() {
  if (recorder || typeof window === "undefined" || typeof performance === "undefined") {
    return;
  }
  const entryScript = performance.now();
  // The resource timing buffer is raised by index.html, before the entry module loads: here, the
  // static module graph is already fetched (hundreds of modules from the Vite dev server, #583).
  const steps: LoadTimingStep[] = [];
  recorder = createLoadTimingRecorder({
    now: () => performance.now(),
    timeOrigin: performance.timeOrigin,
    schedule: (callback, delayMs) => {
      const id = setTimeout(callback, delayMs);
      return () => clearTimeout(id);
    },
    idle: (callback) => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => callback(), { timeout: 10000 });
      } else {
        setTimeout(callback, 0);
      }
    },
    isLoading: () => document.querySelector(`[${LOAD_TIMING_LOADING_ATTRIBUTE}]`) !== null,
    newUuid,
    onStep: (step) => {
      steps.push(step);
      window.__miroirLoadTimings = steps;
      logStep(step);
    },
    onWriteError: (error) => console.warn(LOG_PREFIX, "recording in the Meta app failed, not recording any more:", error),
  });
  recorder.mark("entryScript", entryScript);

  const navigation = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigation) {
    recorder.mark("responseEnd", navigation.responseEnd);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => recorder?.mark("domContentLoaded"), { once: true });
  } else if (navigation?.domContentLoadedEventEnd) {
    recorder.mark("domContentLoaded", navigation.domContentLoadedEventEnd);
  }

  if (typeof PerformanceObserver !== "undefined") {
    try {
      const resources = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
          recorder?.resource(entry);
        }
      });
      resources.observe({ type: "resource", buffered: true });
      teardown.push(() => resources.disconnect());
    } catch {
      // no Resource Timing: steps have no files
    }
  }

  if (typeof MutationObserver !== "undefined" && document.body) {
    const mutations = new MutationObserver((records) => {
      if (records.some((record) => !isIgnored(record.target))) {
        recorder?.activity(performance.now());
      }
    });
    mutations.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    teardown.push(() => mutations.disconnect());
  }

  if (typeof window.fetch === "function") {
    const originalFetch = window.fetch;
    // A request stays in flight until its body is downloaded: fetch resolves on the headers, and
    // RestClient reads the body after. Reading a clone does not download the body twice.
    const countingFetch: typeof window.fetch = function (this: unknown, ...args) {
      recorder?.requestStarted();
      const ended = () => recorder?.requestEnded();
      return originalFetch.apply(this, args).then(
        (response) => {
          try {
            response.clone().arrayBuffer().catch(() => undefined).finally(ended);
          } catch {
            ended();
          }
          return response;
        },
        (error) => {
          ended();
          throw error;
        },
      );
    };
    window.fetch = countingFetch;
    teardown.push(() => {
      if (window.fetch === countingFetch) {
        window.fetch = originalFetch;
      }
    });
  }

  const onPageHide = () => recorder?.flush();
  window.addEventListener("pagehide", onPageHide);
  teardown.push(() => window.removeEventListener("pagehide", onPageHide));
}

// ################################################################################################
/** The page kind of a location: the `page` URL parameter, else the first path segment (legacy). */
export function loadTimingPageKind(location: { pathname: string; search: string }): string {
  return new URLSearchParams(location.search).get("page") ?? location.pathname.split("/").filter(Boolean)[0] ?? "home";
}

function urlOf(location: { pathname: string; search: string }): string {
  const search = new URLSearchParams(location.search);
  search.delete(LOAD_TIMINGS_URL_PARAMETER);
  const query = search.toString();
  return `${location.pathname}${query ? `?${query}` : ""}`;
}

type RouterLike = {
  state: { location: { pathname: string; search: string; key: string }; historyAction: string };
  subscribe(listener: (state: RouterLike["state"]) => void): () => void;
};

/** Follows the router outside React: a step starts on the first display of a page kind. */
export function followLoadTimingNavigation(router: RouterLike): void {
  if (!recorder || recorder.isOff()) {
    return;
  }
  const navigate = (location: RouterLike["state"]["location"], action: string) =>
    recorder?.navigate({
      page: loadTimingPageKind(location),
      url: urlOf(location),
      action: action as LoadTimingNavigation["action"],
    });
  // router.subscribe fires on every router state change: only a location change is a navigation.
  // The key alone is not enough: a history entry pushed outside the router has the key "default".
  const identity = (location: RouterLike["state"]["location"]) => `${location.key}|${location.pathname}${location.search}`;
  navigate(router.state.location, "POP");
  let last = identity(router.state.location);
  const unsubscribe = router.subscribe((state) => {
    if (identity(state.location) === last) {
      return;
    }
    last = identity(state.location);
    navigate(state.location, state.historyAction);
  });
  teardown.push(unsubscribe);
}

/** A milestone of the open step, e.g. `firstRender`. Does nothing when the measurement is off. */
export function loadTimingMark(name: string): void {
  recorder?.mark(name);
}

/** Counts a request the `fetch` wrapper does not see (Electron IPC) as in flight until it settles. */
export function trackLoadTimingRequest<T>(request: Promise<T>): Promise<T> {
  if (!recorder || recorder.isOff()) {
    return request;
  }
  recorder.requestStarted();
  return request.finally(() => recorder?.requestEnded());
}

/** Turns the measurement on or off, once the client configuration is known (analysis D1, D8). */
export function configureLoadTimings(params: {
  config: MiroirConfigClient | undefined;
  client: LoadTimingStep["client"];
  domainController?: DomainControllerInterface;
}): void {
  if (!recorder) {
    return;
  }
  let storage: Storage | undefined;
  try {
    storage = window.sessionStorage;
  } catch {
    storage = undefined;
  }
  const value = resolveLoadTimingsSwitch(params.config, window.location.search, storage);
  const domainController = params.domainController;
  const writes =
    value.enabled && value.record && domainController && configurationListsDeployment(params.config, META_DEPLOYMENT_UUID);
  recorder.configure(
    value,
    {
      client: params.client,
      buildMode: import.meta.env?.DEV ? "development" : "production",
      ...(params.config?.environment?.name ? { environment: params.config.environment.name } : {}),
    },
    writes
      ? async (steps) => {
          const { loadTimingWriter } = await import("./loadTimingWriter.js");
          return loadTimingWriter(domainController)(steps);
        }
      : undefined,
  );
  if (!value.enabled) {
    teardown.splice(0).forEach((undo) => undo());
    return;
  }
  window.__miroirLoadTimings ??= [];
  if (value.record && !writes) {
    console.info(LOG_PREFIX, "the client configuration has no Meta deployment: steps are kept on window.__miroirLoadTimings only");
  }
}

// vitest (happy-dom) loads this module with every page component: no observer, no fetch wrapper there.
if (import.meta.env?.VITE_TEST_MODE !== "true") {
  startObserving();
}
