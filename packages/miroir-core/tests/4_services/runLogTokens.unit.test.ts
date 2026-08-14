import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { templateLogLevelOptionsFactory } from "../../src/4_services/MiroirLoggerFactory";
import {
  CROCKFORD_RUN_ID_ALPHABET,
  formatRunBanner,
  formatRunLogPrefix,
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

    await tracker.trackAction("outer", undefined, async () => {
      expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.s1.#`);
      await tracker.trackAction("inner", undefined, async () => {
        expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.s2.#`);
      });
      expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.s1.#`);
    });

    expect(LoggerGlobalContext.getRunLogPrefix()).toBe(`#${runId}.-.#`);
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
