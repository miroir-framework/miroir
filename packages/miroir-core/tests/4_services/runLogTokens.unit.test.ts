import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { templateLogLevelOptionsFactory } from "../../src/4_services/MiroirLoggerFactory";
import {
  CROCKFORD_RUN_ID_ALPHABET,
  formatRunBanner,
  formatRunLogPrefix,
  formatSpanBoundaryLine,
  generateRunId,
  LoggerGlobalContext,
  RUN_LOG_PREFIX_PATTERN,
} from "../../src/4_services/LoggerContext";

describe("run log tokens", () => {
  afterEach(() => {
    LoggerGlobalContext.reset();
  });

  it("generateRunId returns 6 Crockford-base32 characters", () => {
    const runId = generateRunId();
    expect(runId).toHaveLength(6);
    expect(runId).toMatch(new RegExp(`^[${CROCKFORD_RUN_ID_ALPHABET}]{6}$`));
    expect(runId).toBe(runId.toUpperCase());
    expect(runId).not.toMatch(/[ILOU]/);
  });

  it("formatRunLogPrefix is greppable: #runId.spanDir#", () => {
    expect(formatRunLogPrefix("K7X2NQ", "s12", ">")).toBe("#K7X2NQ.s12>#");
    expect(formatRunLogPrefix("K7X2NQ", "s12", ".")).toBe("#K7X2NQ.s12.#");
    expect(formatRunLogPrefix("K7X2NQ", "s12", "<")).toBe("#K7X2NQ.s12<#");
    expect(formatRunLogPrefix("K7X2NQ", undefined, ".")).toBe("#K7X2NQ.-.#");
    expect(formatRunLogPrefix(undefined, undefined, ".")).toBe("#*NoRun*.-.#");
    expect("#K7X2NQ.s12>#").toMatch(RUN_LOG_PREFIX_PATTERN);
    expect("#K7X2NQ.-.#").toMatch(RUN_LOG_PREFIX_PATTERN);
  });

  it("formatRunBanner names the run for copy-paste grep", () => {
    expect(formatRunBanner("K7X2NQ", "START")).toBe("RUN K7X2NQ START");
    expect(formatRunBanner("K7X2NQ", "END", "ok")).toBe("RUN K7X2NQ END status=ok");
  });

  it("formatSpanBoundaryLine pairs enter/exit with the prefix", () => {
    expect(formatSpanBoundaryLine("#K7X2NQ.s1>#", "enter", "DC.handleBoxedQuery")).toBe(
      "#K7X2NQ.s1># → DC.handleBoxedQuery",
    );
    expect(formatSpanBoundaryLine("#K7X2NQ.s1<#", "exit", "DC.handleBoxedQuery", "ok")).toBe(
      "#K7X2NQ.s1<# ← DC.handleBoxedQuery status=ok",
    );
    expect(formatSpanBoundaryLine("#K7X2NQ.s1<#", "exit", "DC.handleBoxedQuery", "error")).toBe(
      "#K7X2NQ.s1<# ← DC.handleBoxedQuery status=error",
    );
  });
});

describe("LoggerGlobalContext run log prefix", () => {
  beforeEach(() => {
    LoggerGlobalContext.reset();
  });

  afterEach(() => {
    LoggerGlobalContext.reset();
  });

  it("starts with no run and formats *NoRun*", () => {
    expect(LoggerGlobalContext.getRunId()).toBeUndefined();
    expect(LoggerGlobalContext.getRunLogPrefix()).toBe("#*NoRun*.-.#");
  });

  it("setRunLogTokens updates the prefix used by loggers", () => {
    LoggerGlobalContext.setRunLogTokens({ runId: "K7X2NQ", spanId: "s1", dir: ">" });
    expect(LoggerGlobalContext.getRunId()).toBe("K7X2NQ");
    expect(LoggerGlobalContext.getRunLogPrefix()).toBe("#K7X2NQ.s1>#");
    LoggerGlobalContext.setRunLogTokens({ dir: "." });
    expect(LoggerGlobalContext.getRunLogPrefix()).toBe("#K7X2NQ.s1.#");
  });
});

describe("MiroirActivityTracker writes run log tokens", () => {
  let tracker: MiroirActivityTracker;

  beforeEach(() => {
    LoggerGlobalContext.reset();
    tracker = new MiroirActivityTracker();
  });

  afterEach(() => {
    tracker.destroy();
    LoggerGlobalContext.reset();
  });

  it("startTest assigns one runId for the leaf; prefix has no span yet", () => {
    const testId = tracker.startTest("Refresh all Instances");
    const runId = LoggerGlobalContext.getRunId();
    expect(runId).toMatch(new RegExp(`^[${CROCKFORD_RUN_ID_ALPHABET}]{6}$`));
    expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.-.#`);
    const activity = tracker.getActivityIndex().get(testId);
    expect(activity?.runId).toBe(runId);
    tracker.endActivity(testId);
    expect(LoggerGlobalContext.getRunId()).toBeUndefined();
    expect(LoggerGlobalContext.getRunLogPrefix()).toBe("#*NoRun*.-.#");
  });

  it("nested trackAction increments span and restores parent on end", async () => {
    const testId = tracker.startTest("leaf");
    const runId = LoggerGlobalContext.getRunId()!;
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      await tracker.trackAction("outer", undefined, async () => {
        expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.s1.#`);
        await tracker.trackAction("inner", undefined, async () => {
          expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.s2.#`);
        });
        expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.s1.#`);
      });
    } finally {
      console.log = originalLog;
    }

    expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.-.#`);
    const enterOuter = lines.findIndex((line) => line.includes(`#${runId}.s1># → outer`));
    const enterInner = lines.findIndex((line) => line.includes(`#${runId}.s2># → inner`));
    const exitInner = lines.findIndex((line) => line.includes(`#${runId}.s2<# ← inner status=ok`));
    const exitOuter = lines.findIndex((line) => line.includes(`#${runId}.s1<# ← outer status=ok`));
    expect(enterOuter).toBeGreaterThanOrEqual(0);
    expect(enterInner).toBeGreaterThan(enterOuter);
    expect(exitInner).toBeGreaterThan(enterInner);
    expect(exitOuter).toBeGreaterThan(exitInner);
    tracker.endActivity(testId);
    expect(LoggerGlobalContext.getRunId()).toBeUndefined();
  });

  it("trackAction without a test still creates a runId", async () => {
    await tracker.trackAction("standalone", undefined, async () => {
      const runId = LoggerGlobalContext.getRunId();
      expect(runId).toMatch(new RegExp(`^[${CROCKFORD_RUN_ID_ALPHABET}]{6}$`));
      expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.s1.#`);
    });
    expect(LoggerGlobalContext.getRunId()).toBeUndefined();
  });

  it("trackAction logs enter then exit with the same span", async () => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      await tracker.trackAction("runBoxedQueryAction", "DC.handleBoxedQuery", async () => {
        expect(LoggerGlobalContext.getRunLogPrefix()).toMatch(/\.s1\.#$/);
      });
      const enter = lines.find((line) => line.includes("→ DC.handleBoxedQuery"));
      const exit = lines.find((line) => line.includes("← DC.handleBoxedQuery"));
      expect(enter).toBeDefined();
      expect(exit).toBeDefined();
      const enterMatch = enter!.match(RUN_LOG_PREFIX_PATTERN);
      const exitMatch = exit!.match(RUN_LOG_PREFIX_PATTERN);
      expect(enterMatch?.[1]).toBe(exitMatch?.[1]);
      expect(enterMatch?.[2]).toBe("s1");
      expect(exitMatch?.[2]).toBe("s1");
      expect(enter).toContain(">#");
      expect(exit).toContain("<#");
      expect(exit).toContain("status=ok");
    } finally {
      console.log = originalLog;
    }
  });

  it("trackAction error path still logs exit with status=error", async () => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      await expect(
        tracker.trackAction("runBoxedQueryAction", "DC.handleBoxedQuery", async () => {
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");
      const enter = lines.find((line) => line.includes("→ DC.handleBoxedQuery"));
      const exit = lines.find((line) => line.includes("← DC.handleBoxedQuery"));
      expect(enter).toBeDefined();
      expect(exit).toBeDefined();
      expect(enter).toMatch(RUN_LOG_PREFIX_PATTERN);
      expect(exit).toMatch(RUN_LOG_PREFIX_PATTERN);
      expect(enter!.match(RUN_LOG_PREFIX_PATTERN)?.[2]).toBe(
        exit!.match(RUN_LOG_PREFIX_PATTERN)?.[2],
      );
      expect(exit).toContain("status=error");
    } finally {
      console.log = originalLog;
    }
  });

  it("startTestAssertion pushes a span under the leaf run", () => {
    const testId = tracker.startTest("leaf");
    const runId = LoggerGlobalContext.getRunId()!;
    const assertionId = tracker.startTestAssertion("checkNumberOfBooks");
    expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.s1.#`);
    tracker.endActivity(assertionId);
    expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.-.#`);
    tracker.endActivity(testId);
  });
});

describe("logger prefix template includes run token", () => {
  it("places runToken before the legacy test-label block", () => {
    const options = templateLogLevelOptionsFactory("3_miroir-core_DomainController", "INFO", "[{{time}}] {{level}} {{name}}### ");
    expect(options.prefix?.template).toMatch(
      /^{{runToken}} #{{testSuite}}{{test}}{{testAssertion}}{{compositeActionSequence}}{{action}}# /,
    );
  });
});
