/**
 * #580: the load timing recorder cuts a page session into steps, ends each step when the page
 * settles, gives it the files fetched during it, and writes finished steps only when no step is open.
 * The host is a fake clock: the recorder gets time and timers from it, as it gets them from the
 * browser in loadTimingBrowser.ts.
 *
 * Not reachable through MiroirTest: browser timing events.
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- loadTimingRecorder
 * ```
 */
import { describe, expect, it } from "vitest";

import {
  createLoadTimingRecorder,
  DEFAULT_LOAD_TIMING_SWITCH,
  type LoadTimingHost,
  type LoadTimingResource,
} from "../../../src/loadTimings/loadTimingRecorder.js";
import type { LoadTimingStep } from "../../../src/loadTimings/loadTimingTypes.js";

type Timer = { at: number; callback: () => void; cancelled: boolean };

/** A host whose time moves only through `advance`. */
function fakeHost() {
  let now = 0;
  let timers: Timer[] = [];
  let loading = false;
  let uuid = 0;
  const host: LoadTimingHost & { advance(ms: number): void; setLoading(value: boolean): void } = {
    now: () => now,
    timeOrigin: Date.parse("2026-10-27T10:00:00.000Z"),
    schedule(callback, delayMs) {
      const timer = { at: now + delayMs, callback, cancelled: false };
      timers.push(timer);
      return () => {
        timer.cancelled = true;
      };
    },
    idle: (callback) => callback(),
    isLoading: () => loading,
    newUuid: () => `uuid-${++uuid}`,
    advance(ms: number) {
      const target = now + ms;
      for (;;) {
        const next = timers.filter((timer) => !timer.cancelled && timer.at <= target).sort((a, b) => a.at - b.at)[0];
        if (!next) {
          break;
        }
        timers = timers.filter((timer) => timer !== next);
        now = Math.max(now, next.at);
        next.callback();
      }
      now = target;
    },
    setLoading(value: boolean) {
      loading = value;
    },
  };
  return host;
}

const context = { client: "webApp" as const, buildMode: "production" as const, environment: "dev" };

function resource(name: string, startTime: number, responseEnd: number, initiatorType = "script"): LoadTimingResource {
  return { name, initiatorType, startTime, responseEnd, transferSize: 1000, encodedBodySize: 900 };
}

/** A recorder switched on, whose initial load is on the home page and rendered at 800 ms. */
function startedRecorder(options: { write?: (steps: LoadTimingStep[]) => Promise<any> } = {}) {
  const host = fakeHost();
  const recorder = createLoadTimingRecorder(host);
  recorder.navigate({ page: "home", url: "/?page=home", action: "POP" });
  recorder.configure({ ...DEFAULT_LOAD_TIMING_SWITCH, enabled: true }, context, options.write);
  return { host, recorder };
}

function renderInitialPage(host: ReturnType<typeof fakeHost>, recorder: ReturnType<typeof startedRecorder>["recorder"]) {
  host.advance(800);
  recorder.mark("firstRender");
  host.advance(200);
  recorder.activity(host.now());
}

describe("load timing recorder (#580)", () => {
  it("ends the initial load at its last activity, once the page was quiet for the window", () => {
    const { host, recorder } = startedRecorder();
    recorder.mark("entryScript", 120);
    renderInitialPage(host, recorder);
    host.advance(1499);
    expect(recorder.steps()).toEqual([]);
    host.advance(1);
    expect(recorder.steps().map((step) => [step.step, step.page, step.durationMs, step.settled, step.milestones])).toEqual([
      ["initialLoad", "home", 1000, true, { entryScript: 120, firstRender: 800 }],
    ]);
    expect(recorder.steps()[0].measuredAt).toBe("2026-10-27T10:00:00.000Z");
  });

  it("does not end the initial load before the first render", () => {
    const { host, recorder } = startedRecorder();
    host.advance(5000);
    expect(recorder.steps()).toEqual([]);
  });

  it("does not end a step while a request is in flight", () => {
    const { host, recorder } = startedRecorder();
    renderInitialPage(host, recorder);
    recorder.requestStarted();
    host.advance(4000);
    expect(recorder.steps()).toEqual([]);
    recorder.requestEnded();
    host.advance(1500);
    expect(recorder.steps()[0].durationMs).toBe(5000);
  });

  it("does not end a step while a loading placeholder is displayed", () => {
    const { host, recorder } = startedRecorder();
    renderInitialPage(host, recorder);
    host.setLoading(true);
    host.advance(4000);
    expect(recorder.steps()).toEqual([]);
    host.setLoading(false);
    recorder.activity(host.now());
    host.advance(1500);
    expect(recorder.steps()[0].durationMs).toBe(5000);
  });

  it("gives a step the files and the data requests that started during it", () => {
    const { host, recorder } = startedRecorder();
    recorder.resource(resource("https://localhost:3080/assets/index-abc.js?v=1", 20, 300));
    recorder.resource(resource("https://localhost:3080/assets/index-abc.css", 25, 200, "link"));
    recorder.resource(resource("https://localhost:3080/CRUD/x", 400, 450, "fetch"));
    recorder.resource(resource("https://localhost:3080/logo.png", 30, 60, "img"));
    renderInitialPage(host, recorder);
    host.advance(1500);
    const [initial] = recorder.steps();
    expect(initial.chunks.map((chunk) => [chunk.file, chunk.startMs, chunk.durationMs])).toEqual([
      ["/assets/index-abc.js", 20, 280],
      ["/assets/index-abc.css", 25, 175],
    ]);
    expect([initial.chunkCount, initial.chunkTransferBytes, initial.dataRequestCount, initial.dataTransferBytes]).toEqual([
      2, 2000, 1, 1000,
    ]);
  });

  it("starts a route step on the first display of a page kind, with the files fetched from its start", () => {
    const { host, recorder } = startedRecorder();
    renderInitialPage(host, recorder);
    host.advance(1500);
    recorder.navigate({ page: "report", url: "/?page=report&reportUuid=r1", action: "PUSH" });
    const start = host.now();
    recorder.resource(resource("/assets/ReportDisplay-x.js", start + 5, start + 105));
    host.advance(300);
    recorder.activity(host.now());
    host.advance(1500);
    const route = recorder.steps()[1];
    expect([route.step, route.page, route.url, route.durationMs, route.settled]).toEqual([
      "route:report", "report", "/?page=report&reportUuid=r1", 300, true,
    ]);
    expect(route.chunks.map((chunk) => [chunk.file, chunk.startMs])).toEqual([["/assets/ReportDisplay-x.js", 5]]);
  });

  it("does not start a step for a page kind already displayed, nor for a query change on the same page", () => {
    const { host, recorder } = startedRecorder();
    renderInitialPage(host, recorder);
    host.advance(1500);
    recorder.navigate({ page: "home", url: "/?page=home&x=1", action: "REPLACE" });
    recorder.navigate({ page: "report", url: "/?page=report", action: "PUSH" });
    host.advance(1500);
    recorder.navigate({ page: "home", url: "/?page=home", action: "PUSH" });
    recorder.navigate({ page: "report", url: "/?page=report&reportUuid=r2", action: "PUSH" });
    host.advance(5000);
    expect(recorder.steps().map((step) => step.step)).toEqual(["initialLoad", "route:report"]);
  });

  it("follows a redirect: a REPLACE during an open step keeps the step on the new page", () => {
    const { host, recorder } = startedRecorder();
    recorder.navigate({ page: "login", url: "/?page=login", action: "REPLACE" });
    renderInitialPage(host, recorder);
    host.advance(1500);
    expect(recorder.steps().map((step) => [step.step, step.page, step.settled])).toEqual([["initialLoad", "login", true]]);
  });

  it("ends an open step unsettled when the user goes to another page kind", () => {
    const { host, recorder } = startedRecorder();
    renderInitialPage(host, recorder);
    host.advance(500);
    recorder.navigate({ page: "model", url: "/?page=model", action: "PUSH" });
    host.advance(1500);
    expect(recorder.steps().map((step) => [step.step, step.durationMs, step.settled])).toEqual([
      ["initialLoad", 1500, false],
      ["route:model", 0, true],
    ]);
  });

  it("ends a step that never settles at the cap, unsettled", () => {
    const { host, recorder } = startedRecorder();
    renderInitialPage(host, recorder);
    for (let i = 0; i < 70; i++) {
      host.advance(500);
      recorder.activity(host.now());
    }
    expect(recorder.steps().map((step) => [step.durationMs, step.settled])).toEqual([[30000, false]]);
  });

  describe("writes", () => {
    function writingRecorder() {
      const writes: LoadTimingStep[][] = [];
      let resolveWrite: (value: any) => void = () => {};
      const write = (steps: LoadTimingStep[]) => {
        writes.push(steps);
        return new Promise((resolve) => {
          resolveWrite = resolve;
        });
      };
      const started = startedRecorder({ write });
      return { ...started, writes, resolveWrite: (value: any) => resolveWrite(value) };
    }

    it("writes nothing before the configurations are loaded, then every queued step at once", () => {
      const { host, recorder, writes } = writingRecorder();
      renderInitialPage(host, recorder);
      host.advance(1500);
      recorder.navigate({ page: "report", url: "/?page=report", action: "PUSH" });
      host.advance(1500);
      host.advance(5000);
      expect(writes).toEqual([]);
      recorder.mark("configurationsLoaded");
      host.advance(1999);
      expect(writes).toEqual([]);
      host.advance(1);
      expect(writes.map((batch) => batch.map((step) => step.step))).toEqual([["initialLoad", "route:report"]]);
    });

    it("does not write while a step is open", () => {
      const { host, recorder, writes } = writingRecorder();
      recorder.mark("configurationsLoaded");
      renderInitialPage(host, recorder);
      host.advance(1500);
      host.advance(1000);
      recorder.navigate({ page: "report", url: "/?page=report", action: "PUSH" });
      host.advance(1400);
      expect(writes).toEqual([]);
      host.advance(100);
      host.advance(2000);
      expect(writes.map((batch) => batch.length)).toEqual([2]);
    });

    it("marks a step that starts during a write", async () => {
      const { host, recorder, writes, resolveWrite } = writingRecorder();
      recorder.mark("configurationsLoaded");
      renderInitialPage(host, recorder);
      host.advance(3500);
      expect(writes.length).toBe(1);
      recorder.navigate({ page: "report", url: "/?page=report", action: "PUSH" });
      resolveWrite({ ok: true });
      await Promise.resolve();
      host.advance(1500);
      expect(recorder.steps()[1].overlapsWrite).toBe(true);
    });

    it("stops writing after a failed write", async () => {
      const { host, recorder, writes, resolveWrite } = writingRecorder();
      recorder.mark("configurationsLoaded");
      renderInitialPage(host, recorder);
      host.advance(3500);
      resolveWrite({ ok: false, error: "no Meta deployment" });
      await Promise.resolve();
      recorder.navigate({ page: "report", url: "/?page=report", action: "PUSH" });
      host.advance(10000);
      expect(writes.length).toBe(1);
      expect(recorder.steps().length).toBe(2);
    });

    it("stops writing after a rejected write, as after a failed one", async () => {
      const host = fakeHost();
      const errors: string[] = [];
      const writes: LoadTimingStep[][] = [];
      const recorder = createLoadTimingRecorder({ ...host, onWriteError: (error) => errors.push(error) });
      recorder.navigate({ page: "home", url: "/", action: "POP" });
      recorder.configure({ ...DEFAULT_LOAD_TIMING_SWITCH, enabled: true }, context, (steps) => {
        writes.push(steps);
        return Promise.reject(new Error("cannot load the writer"));
      });
      recorder.mark("configurationsLoaded");
      renderInitialPage(host, recorder);
      host.advance(3500);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(errors).toEqual(["Error: cannot load the writer"]);
      recorder.navigate({ page: "report", url: "/?page=report", action: "PUSH" });
      host.advance(10000);
      expect(writes.length).toBe(1);
      expect(recorder.steps()[1].overlapsWrite).toBeFalsy();
    });

    it("keeps steps without writing them when recording is off", () => {
      const host = fakeHost();
      const writes: LoadTimingStep[][] = [];
      const recorder = createLoadTimingRecorder(host);
      recorder.navigate({ page: "home", url: "/", action: "POP" });
      recorder.configure({ ...DEFAULT_LOAD_TIMING_SWITCH, enabled: true, record: false }, context, async (steps) => {
        writes.push(steps);
        return { ok: true };
      });
      recorder.mark("configurationsLoaded");
      renderInitialPage(host, recorder);
      host.advance(10000);
      expect([recorder.steps().length, writes.length]).toEqual([1, 0]);
    });
  });

  it("drops what it observed and records nothing when the switch is off", () => {
    const host = fakeHost();
    const recorder = createLoadTimingRecorder(host);
    recorder.resource(resource("/assets/index.js", 10, 100));
    recorder.configure(DEFAULT_LOAD_TIMING_SWITCH, context);
    recorder.mark("firstRender");
    host.advance(10000);
    recorder.navigate({ page: "report", url: "/?page=report", action: "PUSH" });
    host.advance(10000);
    expect([recorder.isOff(), recorder.steps()]).toEqual([true, []]);
  });
});
