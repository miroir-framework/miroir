import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LoggerGlobalContext,
  MiroirActivityTracker,
  MiroirLoggerFactory,
  RUN_LOG_PREFIX_PATTERN,
  type RunBoxedQueryAction,
} from "miroir-core";
import { SqlDbQueryRunner } from "../src/4_services/SqlDbQueryRunner";

function boxedQueryAction(): RunBoxedQueryAction {
  return {
    actionType: "runBoxedQueryAction",
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    payload: {
      application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
      applicationSection: "data",
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        extractors: {},
      },
    },
  } as RunBoxedQueryAction;
}

describe("SqlDbQueryRunner query hop spans", () => {
  let tracker: MiroirActivityTracker;
  let previousTracker: ReturnType<typeof MiroirLoggerFactory.getStartedActivityTracker>;

  beforeEach(() => {
    LoggerGlobalContext.reset();
    tracker = new MiroirActivityTracker();
    previousTracker = MiroirLoggerFactory.getStartedActivityTracker();
    MiroirLoggerFactory.activityTracker = tracker;
    tracker.startTest("Refresh all Instances");
  });

  afterEach(() => {
    tracker.destroy();
    MiroirLoggerFactory.activityTracker = previousTracker;
    LoggerGlobalContext.reset();
  });

  it("handleBoxedQueryAction logs SqlDbQueryRunner enter/exit", async () => {
    const runner = new SqlDbQueryRunner(
      "Library",
      { getStoreName: () => "test" } as any,
      {} as any,
    );
    (runner as any).inMemoryImplementationExtractorRunnerMap = {
      runQuery: async () => ({ books: [1, 2, 3, 4, 5] }),
    };
    (runner as any).dbImplementationExtractorRunnerMap = {
      runQuery: async () => ({ books: [1, 2, 3, 4, 5] }),
    };
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      await runner.handleBoxedQueryAction(boxedQueryAction(), {});
    } finally {
      console.log = originalLog;
    }
    const enter = lines.find((line) => line.includes("→ SqlDbQueryRunner"));
    const exit = lines.find((line) => line.includes("← SqlDbQueryRunner"));
    expect(enter).toBeDefined();
    expect(exit).toBeDefined();
    expect(exit).toContain("books=5");
    expect(enter!.match(RUN_LOG_PREFIX_PATTERN)?.[2]).toBe(
      exit!.match(RUN_LOG_PREFIX_PATTERN)?.[2],
    );
  });
});
