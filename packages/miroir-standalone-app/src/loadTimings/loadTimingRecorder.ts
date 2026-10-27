import type { LoadTimingChunk, LoadTimingStep, LoadTimingWrite } from "./loadTimingTypes.js";

// ################################################################################################
// #580: the load timing recorder, without any browser API: the browser adapter
// (loadTimingBrowser.ts) feeds it with events, and tests feed it with a fake clock. It cuts the
// page session into steps (the initial load, then the first display of each page kind), ends a
// step when the page settles, gives each step the files fetched during it, and writes finished
// steps only when no step is open (analysis D2, D3, D4, D6).
// No imports but types: the recorder is loaded with the page.
// ################################################################################################

export type LoadTimingSwitch = {
  enabled: boolean;
  record: boolean;
  quietWindowMs: number;
  maxStepMs: number;
};

export type LoadTimingContext = Pick<LoadTimingStep, "client" | "buildMode" | "environment" | "miroirVersion">;

/** What the recorder needs from its host: time, timers and the page state it cannot observe. */
export type LoadTimingHost = {
  /** ms since the time origin (performance.now()). */
  now(): number;
  /** Epoch ms of the time origin (performance.timeOrigin). */
  timeOrigin: number;
  schedule(callback: () => void, delayMs: number): () => void;
  /** Runs the callback when the page is idle (requestIdleCallback). */
  idle(callback: () => void): void;
  /** Whether a loading placeholder (Suspense fallback) is displayed. */
  isLoading(): boolean;
  newUuid(): string;
  /** Called with each finished step, written or not. */
  onStep?(step: LoadTimingStep): void;
  onWriteError?(error: string): void;
};

/** The part of a PerformanceResourceTiming entry the recorder reads. */
export type LoadTimingResource = {
  name: string;
  initiatorType: string;
  startTime: number;
  responseEnd: number;
  transferSize: number;
  encodedBodySize: number;
};

export type LoadTimingNavigation = { page: string; url: string; action: "POP" | "PUSH" | "REPLACE" };

export const INITIAL_LOAD_STEP = "initialLoad";
/** Delay between the end of the last step and the write, so that the page is idle (D6). */
export const LOAD_TIMING_WRITE_DELAY_MS = 2000;
export const DEFAULT_LOAD_TIMING_SWITCH: LoadTimingSwitch = {
  enabled: false,
  record: true,
  quietWindowMs: 1500,
  maxStepMs: 30000,
};

const CHUNK_EXTENSIONS = [".js", ".mjs", ".css", ".ts", ".tsx", ".jsx"];
const DATA_INITIATORS = new Set(["fetch", "xmlhttprequest"]);

type OpenStep = {
  step: string;
  page: string;
  url: string;
  start: number;
  lastActivity: number;
  overlapsWrite: boolean;
  milestones: Record<string, number>;
};

function pathOf(url: string): string {
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

function isChunk(resource: LoadTimingResource): boolean {
  const path = pathOf(resource.name);
  return !DATA_INITIATORS.has(resource.initiatorType) && CHUNK_EXTENSIONS.some((extension) => path.endsWith(extension));
}

function rounded(value: number): number {
  return Math.round(value);
}

export type LoadTimingRecorder = ReturnType<typeof createLoadTimingRecorder>;

export function createLoadTimingRecorder(host: LoadTimingHost) {
  let state: "pending" | "on" | "off" = "pending";
  let settings: LoadTimingSwitch = DEFAULT_LOAD_TIMING_SWITCH;
  let context: LoadTimingContext = { client: "webApp", buildMode: "production" };
  let write: LoadTimingWrite | undefined;
  const pageLoad = host.newUuid();

  let open: OpenStep | undefined = {
    step: INITIAL_LOAD_STEP,
    page: "",
    url: "",
    start: 0,
    lastActivity: 0,
    overlapsWrite: false,
    milestones: {},
  };
  let lastPage: string | undefined;
  const seenPages = new Set<string>();
  let resources: LoadTimingResource[] = [];
  let requestsInFlight = 0;
  let cancelCheck: (() => void) | undefined;

  const finished: LoadTimingStep[] = [];
  const queue: LoadTimingStep[] = [];
  let configurationsLoaded = false;
  let writing = false;
  let writeStopped = false;
  let cancelWrite: (() => void) | undefined;

  // ##############################################################################################
  function activity(at: number) {
    if (state === "off" || !open) {
      return;
    }
    open.lastActivity = Math.max(open.lastActivity, at);
    scheduleCheck(settings.quietWindowMs);
  }

  function scheduleCheck(delayMs: number) {
    if (state !== "on" || cancelCheck || !open) {
      return;
    }
    const untilCap = open.start + settings.maxStepMs - host.now();
    cancelCheck = host.schedule(() => {
      cancelCheck = undefined;
      check();
    }, Math.max(0, Math.min(delayMs, untilCap)));
  }

  /** Ends the open step when the page settled, or when the step reached its cap. */
  function check() {
    if (state !== "on" || !open) {
      return;
    }
    const now = host.now();
    if (now - open.start >= settings.maxStepMs) {
      end(open.start + settings.maxStepMs, false);
      return;
    }
    const blocked =
      requestsInFlight > 0 ||
      host.isLoading() ||
      (open.step === INITIAL_LOAD_STEP && open.milestones.firstRender === undefined);
    const quietFor = now - open.lastActivity;
    if (blocked || quietFor < settings.quietWindowMs) {
      scheduleCheck(blocked ? settings.quietWindowMs : settings.quietWindowMs - quietFor);
      return;
    }
    end(open.lastActivity, true);
  }

  function end(at: number, settled: boolean) {
    if (!open) {
      return;
    }
    const step = open;
    open = undefined;
    cancelCheck?.();
    cancelCheck = undefined;
    const inStep = resources.filter((resource) => resource.startTime >= step.start && resource.startTime <= at);
    resources = resources.filter((resource) => resource.startTime > at);
    const chunks: LoadTimingChunk[] = inStep.filter(isChunk).map((resource) => ({
      file: pathOf(resource.name),
      startMs: rounded(resource.startTime - step.start),
      durationMs: rounded(resource.responseEnd - resource.startTime),
      transferBytes: resource.transferSize,
      encodedBytes: resource.encodedBodySize,
    }));
    const dataRequests = inStep.filter((resource) => DATA_INITIATORS.has(resource.initiatorType));
    const record: LoadTimingStep = {
      pageLoad,
      measuredAt: new Date(host.timeOrigin + step.start).toISOString(),
      step: step.step,
      page: step.page,
      url: step.url,
      durationMs: rounded(at - step.start),
      settled,
      ...(step.overlapsWrite ? { overlapsWrite: true } : {}),
      ...(Object.keys(step.milestones).length > 0
        ? {
            milestones: Object.fromEntries(
              Object.entries(step.milestones).map(([name, time]) => [name, rounded(time - step.start)]),
            ),
          }
        : {}),
      chunkCount: chunks.length,
      chunkTransferBytes: chunks.reduce((sum, chunk) => sum + chunk.transferBytes, 0),
      chunkEncodedBytes: chunks.reduce((sum, chunk) => sum + chunk.encodedBytes, 0),
      chunks,
      dataRequestCount: dataRequests.length,
      dataTransferBytes: dataRequests.reduce((sum, request) => sum + request.transferSize, 0),
      ...context,
    };
    seenPages.add(step.page);
    lastPage = step.page;
    finished.push(record);
    host.onStep?.(record);
    if (settings.record && write && !writeStopped) {
      queue.push(record);
      scheduleWrite();
    }
  }

  function start(step: string, navigation: LoadTimingNavigation) {
    const now = host.now();
    open = {
      step,
      page: navigation.page,
      url: navigation.url,
      start: now,
      lastActivity: now,
      overlapsWrite: writing,
      milestones: {},
    };
    scheduleCheck(settings.quietWindowMs);
  }

  // ##############################################################################################
  function scheduleWrite() {
    if (cancelWrite || writing || open || queue.length === 0 || !configurationsLoaded || writeStopped) {
      return;
    }
    cancelWrite = host.schedule(() => {
      cancelWrite = undefined;
      host.idle(() => runWrite());
    }, LOAD_TIMING_WRITE_DELAY_MS);
  }

  /** `force`: the page is being hidden, write even while a step is open. */
  function runWrite(force = false) {
    if ((open && !force) || writing || queue.length === 0 || !write || writeStopped) {
      return;
    }
    writing = true;
    const batch = queue.splice(0, queue.length);
    write(batch).then((result) => {
      writing = false;
      if (!result.ok) {
        writeStopped = true;
        queue.length = 0;
        host.onWriteError?.(result.error);
        return;
      }
      scheduleWrite();
    });
  }

  // ##############################################################################################
  return {
    /** A DOM change of the page, at `at` ms. */
    activity,
    resource(entry: LoadTimingResource) {
      if (state === "off") {
        return;
      }
      resources.push(entry);
      activity(entry.responseEnd);
    },
    requestStarted() {
      requestsInFlight++;
    },
    requestEnded() {
      requestsInFlight = Math.max(0, requestsInFlight - 1);
      activity(host.now());
    },
    /** A milestone of the open step, at `at` ms (default: now). */
    mark(name: string, at: number = host.now()) {
      if (name === "configurationsLoaded") {
        configurationsLoaded = true;
        scheduleWrite();
      }
      if (state === "off" || !open || open.milestones[name] !== undefined) {
        return;
      }
      open.milestones[name] = at;
      activity(at);
    },
    navigate(navigation: LoadTimingNavigation) {
      if (state === "off") {
        return;
      }
      if (open && (navigation.page === open.page || open.page === "")) {
        open.url = navigation.url;
        open.page = navigation.page;
        return;
      }
      if (open && navigation.action === "REPLACE" && !seenPages.has(navigation.page)) {
        open.page = navigation.page;
        open.url = navigation.url;
        return;
      }
      if (!open && navigation.page === lastPage) {
        return;
      }
      if (open) {
        end(host.now(), false);
      }
      if (!seenPages.has(navigation.page)) {
        start(`route:${navigation.page}`, navigation);
      } else {
        lastPage = navigation.page;
      }
    },
    /** Called once the client configuration is known: off drops everything observed so far. */
    configure(value: LoadTimingSwitch, stepContext: LoadTimingContext, writer?: LoadTimingWrite) {
      if (state !== "pending") {
        return;
      }
      settings = value;
      context = stepContext;
      write = writer;
      if (!value.enabled) {
        state = "off";
        open = undefined;
        resources = [];
        return;
      }
      state = "on";
      if (open) {
        scheduleCheck(settings.quietWindowMs);
      }
    },
    /** Writes the queued steps at once (the page is being hidden). */
    flush() {
      cancelWrite?.();
      cancelWrite = undefined;
      runWrite(true);
    },
    isOn() {
      return state === "on";
    },
    isOff() {
      return state === "off";
    },
    steps(): LoadTimingStep[] {
      return [...finished];
    },
  };
}
