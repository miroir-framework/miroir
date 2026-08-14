import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { PersistenceStoreController } from "../../src/4_services/PersistenceStoreController";
import { MiroirLoggerFactory } from "../../src/4_services/MiroirLoggerFactory";
import { LoggerGlobalContext, RUN_LOG_PREFIX_PATTERN } from "../../src/4_services/LoggerContext";
import { queryActionHandler } from "../../src/4_services/RestServer";
import type { RunBoxedQueryAction } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

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

function captureConsoleLog(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  return {
    lines,
    restore: () => {
      console.log = originalLog;
    },
  };
}

describe("query hop enter/exit spans", () => {
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

  it("PersistenceStoreController.handleBoxedQueryAction logs PSC.handleBoxedQuery", async () => {
    const dataStoreSection = {
      getStoreName: () => "test-data",
      handleBoxedQueryAction: vi.fn(async () => ({
        status: "ok",
        returnedDomainElement: { books: [1, 2, 3, 4, 5] },
      })),
    };
    const controller = new PersistenceStoreController(
      { getStoreName: () => "admin" } as any,
      { getStoreName: () => "test-model" } as any,
      dataStoreSection as any,
    );
    const { lines, restore } = captureConsoleLog();
    try {
      await controller.handleBoxedQueryAction(boxedQueryAction(), {});
    } finally {
      restore();
    }
    const enter = lines.find((line) => line.includes("→ PSC.handleBoxedQuery"));
    const exit = lines.find((line) => line.includes("← PSC.handleBoxedQuery"));
    expect(enter).toBeDefined();
    expect(exit).toBeDefined();
    expect(enter).toContain("section=data");
    expect(exit).toContain("books=5");
    expect(enter!.match(RUN_LOG_PREFIX_PATTERN)?.[2]).toBe(
      exit!.match(RUN_LOG_PREFIX_PATTERN)?.[2],
    );
  });

  it("queryActionHandler logs REST.POST /query", async () => {
    const domainController = {
      getPersistenceStoreAccessMode: () => "local",
      handleBoxedExtractorOrQueryAction: vi.fn(async () => ({
        status: "ok",
        returnedDomainElement: { books: [1, 2, 3, 4, 5] },
      })),
    };
    const { lines, restore } = captureConsoleLog();
    try {
      await queryActionHandler(
        true,
        () => (result: unknown) => result,
        undefined,
        {} as any,
        domainController as any,
        "post",
        "/query",
        { action: boxedQueryAction(), applicationDeploymentMap: {} },
        {},
      );
    } finally {
      restore();
    }
    const enter = lines.find((line) => line.includes("→ REST.POST /query"));
    const exit = lines.find((line) => line.includes("← REST.POST /query"));
    expect(enter).toBeDefined();
    expect(exit).toBeDefined();
    expect(exit).toContain("books=5");
    expect(enter!.match(RUN_LOG_PREFIX_PATTERN)?.[2]).toBe(
      exit!.match(RUN_LOG_PREFIX_PATTERN)?.[2],
    );
  });
});
