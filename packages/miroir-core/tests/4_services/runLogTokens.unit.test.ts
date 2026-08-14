import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../src/3_controllers/MiroirEventService";
import { MiroirLoggerFactory, templateLogLevelOptionsFactory } from "../../src/4_services/MiroirLoggerFactory";
import {
  CROCKFORD_RUN_ID_ALPHABET,
  formatRunBanner,
  formatRunLogPrefix,
  formatSpanBoundaryLine,
  generateRunId,
  LoggerGlobalContext,
  RUN_LOG_PREFIX_PATTERN,
} from "../../src/4_services/LoggerContext";
import { summarizeQueryHopResult, trackQueryHop } from "../../src/4_services/trackQueryHop";
import {
  formatRollbackSectionSummary,
  logPhaseForActionType,
  summarizeRollbackInstanceCollections,
} from "../../src/4_services/rollbackLog";

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

  it("formatSpanBoundaryLine appends optional extra on enter and exit", () => {
    expect(
      formatSpanBoundaryLine(
        "#K7X2NQ.s1>#",
        "enter",
        "DC.handleBoxedQuery",
        undefined,
        "strategy=localCacheOrFail mode=remote",
      ),
    ).toBe("#K7X2NQ.s1># → DC.handleBoxedQuery strategy=localCacheOrFail mode=remote");
    expect(
      formatSpanBoundaryLine("#K7X2NQ.s1<#", "exit", "PSC.handleBoxedQuery", "ok", "section=data books=5"),
    ).toBe("#K7X2NQ.s1<# ← PSC.handleBoxedQuery status=ok section=data books=5");
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

  it("trackAction enterExtra and exitExtra appear on the paired lines", async () => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      await tracker.trackAction(
        "runBoxedQueryAction",
        "DC.handleBoxedQuery",
        async () => ({ status: "ok", returnedDomainElement: { books: [1, 2, 3, 4, 5] } }),
        {
          enterExtra: "strategy=localCacheOrFail mode=remote",
          exitExtra: (result) => summarizeQueryHopResult(result),
        },
      );
    } finally {
      console.log = originalLog;
    }
    const enter = lines.find((line) => line.includes("→ DC.handleBoxedQuery"));
    const exit = lines.find((line) => line.includes("← DC.handleBoxedQuery"));
    expect(enter).toContain("strategy=localCacheOrFail mode=remote");
    expect(exit).toContain("status=ok");
    expect(exit).toContain("books=5");
  });
});

describe("trackQueryHop uses the started activity tracker", () => {
  let tracker: MiroirActivityTracker;
  let previousTracker: ReturnType<typeof MiroirLoggerFactory.getStartedActivityTracker>;

  beforeEach(() => {
    LoggerGlobalContext.reset();
    tracker = new MiroirActivityTracker();
    previousTracker = MiroirLoggerFactory.getStartedActivityTracker();
    MiroirLoggerFactory.activityTracker = tracker;
  });

  afterEach(() => {
    tracker.destroy();
    MiroirLoggerFactory.activityTracker = previousTracker;
    LoggerGlobalContext.reset();
  });

  it("emits catalog block enter/exit with the same span", async () => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      await trackQueryHop("saga.localCache", async () => "ok");
    } finally {
      console.log = originalLog;
    }
    const enter = lines.find((line) => line.includes("→ saga.localCache"));
    const exit = lines.find((line) => line.includes("← saga.localCache"));
    expect(enter).toBeDefined();
    expect(exit).toBeDefined();
    expect(enter!.match(RUN_LOG_PREFIX_PATTERN)?.[2]).toBe(
      exit!.match(RUN_LOG_PREFIX_PATTERN)?.[2],
    );
    expect(exit).toContain("status=ok");
  });

  it("runs the function without a span when no tracker is started", async () => {
    MiroirLoggerFactory.activityTracker = undefined;
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      await expect(trackQueryHop("saga.remote", async () => 7)).resolves.toBe(7);
    } finally {
      console.log = originalLog;
    }
    expect(lines.some((line) => line.includes("saga.remote"))).toBe(false);
  });
});

describe("summarizeQueryHopResult", () => {
  it("summarizes boxed query result sizes", () => {
    expect(
      summarizeQueryHopResult({
        status: "ok",
        returnedDomainElement: { books: [1, 2, 3, 4, 5] },
      }),
    ).toBe("books=5");
    expect(summarizeQueryHopResult({ returnedDomainElement: [1, 2] })).toBe("count=2");
    expect(summarizeQueryHopResult(undefined)).toBeUndefined();
  });
});

describe("MiroirActivityTracker writes test labels to LoggerGlobalContext", () => {
  let tracker: MiroirActivityTracker;

  beforeEach(() => {
    LoggerGlobalContext.reset();
    tracker = new MiroirActivityTracker();
    new MiroirEventService(tracker);
  });

  afterEach(() => {
    tracker.destroy();
    LoggerGlobalContext.reset();
  });

  it("startTest writes the leaf label used by the logger prefix", () => {
    tracker.startTest("Refresh all Instances");
    expect(LoggerGlobalContext.getTest()).toBe("Refresh all Instances");
    const options = templateLogLevelOptionsFactory(
      "3_miroir-core_DomainController",
      "INFO",
      "[{{time}}] {{level}} {{name}}### ",
    );
    expect(options.prefix?.test?.({} as never)).toBe("-Refresh all Instances");
  });

  it("trackTestSuite / trackTest / trackTestAssertion nest and restore labels", async () => {
    await tracker.trackTestSuite(
      "domainController.data.crud",
      "domainController.data.crud",
      undefined,
      async () => {
        expect(LoggerGlobalContext.getTestSuite()).toBe("domainController.data.crud");
        await tracker.trackTest("Refresh all Instances", undefined, async () => {
          expect(LoggerGlobalContext.getTest()).toBe("Refresh all Instances");
          expect(LoggerGlobalContext.getTestSuite()).toBe("domainController.data.crud");
          await tracker.trackTestAssertion("checkNumberOfBooks", undefined, async () => {
            expect(LoggerGlobalContext.getTestAssertion()).toBe("checkNumberOfBooks");
            expect(LoggerGlobalContext.getTest()).toBe("Refresh all Instances");
          });
          expect(LoggerGlobalContext.getTestAssertion()).toBeUndefined();
          expect(LoggerGlobalContext.getTest()).toBe("Refresh all Instances");
        });
        expect(LoggerGlobalContext.getTest()).toBeUndefined();
        expect(LoggerGlobalContext.getTestSuite()).toBe("domainController.data.crud");
      },
    );
    expect(LoggerGlobalContext.getTestSuite()).toBeUndefined();
  });

  it("keeps a walk-level suite label while trackTest is running", async () => {
    tracker.beginTestSuiteLogContext("domainController.data.crud");
    try {
      await tracker.trackTest("Refresh all Instances", undefined, async () => {
        expect(LoggerGlobalContext.getTestSuite()).toBe("domainController.data.crud");
        expect(LoggerGlobalContext.getTest()).toBe("Refresh all Instances");
        await tracker.trackTestAssertion("checkNumberOfBooks", undefined, async () => {
          expect(LoggerGlobalContext.getTestSuite()).toBe("domainController.data.crud");
        });
        expect(LoggerGlobalContext.getTestSuite()).toBe("domainController.data.crud");
      });
      expect(LoggerGlobalContext.getTest()).toBeUndefined();
      expect(LoggerGlobalContext.getTestSuite()).toBe("domainController.data.crud");
    } finally {
      tracker.endTestSuiteLogContext();
    }
    expect(LoggerGlobalContext.getTestSuite()).toBeUndefined();
  });
});

describe("logger prefix template includes run token", () => {
  it("places runToken before the legacy test-label block and phase after it", () => {
    const options = templateLogLevelOptionsFactory("3_miroir-core_DomainController", "INFO", "[{{time}}] {{level}} {{name}}### ");
    expect(options.prefix?.template).toMatch(
      /^{{runToken}} #{{testSuite}}{{test}}{{testAssertion}}{{compositeActionSequence}}{{action}}# \{\{phase\}\} /,
    );
  });
});

describe("log phase on LoggerGlobalContext and tracker", () => {
  let tracker: MiroirActivityTracker;

  beforeEach(() => {
    LoggerGlobalContext.reset();
    tracker = new MiroirActivityTracker();
    new MiroirEventService(tracker);
  });

  afterEach(() => {
    tracker.destroy();
    LoggerGlobalContext.reset();
  });

  it("starts with no phase", () => {
    expect(LoggerGlobalContext.getPhase()).toBeUndefined();
    expect(tracker.getPhase()).toBeUndefined();
  });

  it("pushPhase / popPhase nest and restore", () => {
    tracker.pushPhase("rollback");
    expect(LoggerGlobalContext.getPhase()).toBe("rollback");
    tracker.pushPhase("query");
    expect(LoggerGlobalContext.getPhase()).toBe("query");
    tracker.popPhase();
    expect(LoggerGlobalContext.getPhase()).toBe("rollback");
    tracker.popPhase();
    expect(LoggerGlobalContext.getPhase()).toBeUndefined();
  });

  it("trackAction options.phase is set during the span and cleared after", async () => {
    await tracker.trackAction("runBoxedQueryAction", "DC.handleBoxedQuery", async () => {
      expect(LoggerGlobalContext.getPhase()).toBe("query");
    }, { phase: "query" });
    expect(LoggerGlobalContext.getPhase()).toBeUndefined();
  });

  it("trackTestAssertion sets phase=assertion", async () => {
    await tracker.trackTest("Refresh all Instances", undefined, async () => {
      await tracker.trackTestAssertion("checkNumberOfBooks", undefined, async () => {
        expect(LoggerGlobalContext.getPhase()).toBe("assertion");
      });
      expect(LoggerGlobalContext.getPhase()).toBeUndefined();
    });
  });
});

describe("rollback section summaries", () => {
  it("formatRollbackSectionSummary is one INFO line per application/section", () => {
    expect(
      formatRollbackSectionSummary("5af03c98-fe5e-490b-b08f-e1230971c57f", "data", 6, 25),
    ).toBe(
      "rollback application=5af03c98-fe5e-490b-b08f-e1230971c57f section=data entities=6 instances=25",
    );
  });

  it("summarizeRollbackInstanceCollections groups by section and lists entities", () => {
    const { summaries, perEntity } = summarizeRollbackInstanceCollections("app-1", [
      { applicationSection: "model", parentName: "Entity", instances: [{}, {}] },
      { applicationSection: "model", parentName: "EntityVersion", instances: [{}] },
      { applicationSection: "data", parentName: "Book", instances: [{}, {}, {}, {}, {}] },
    ]);
    expect(summaries).toEqual([
      "rollback application=app-1 section=model entities=2 instances=3",
      "rollback application=app-1 section=data entities=1 instances=5",
    ]);
    expect(perEntity).toEqual([
      "rollback application=app-1 section=model entity=Entity instances=2",
      "rollback application=app-1 section=model entity=EntityVersion instances=1",
      "rollback application=app-1 section=data entity=Book instances=5",
    ]);
  });

  it("logPhaseForActionType maps rollback / bootstrap / query", () => {
    expect(logPhaseForActionType("rollback")).toBe("rollback");
    expect(logPhaseForActionType("remoteLocalCacheRollback")).toBe("rollback");
    expect(logPhaseForActionType("initModel")).toBe("bootstrap");
    expect(logPhaseForActionType("storeManagementAction_openStore")).toBe("bootstrap");
    expect(logPhaseForActionType("runBoxedQueryAction")).toBe("query");
    expect(logPhaseForActionType("getInstances")).toBeUndefined();
  });
});
