import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LoggerGlobalContext,
  MiroirActivityTracker,
  MiroirLoggerFactory,
  RUN_LOG_PREFIX_PATTERN,
  type PersistenceAction,
} from "miroir-core";
import { PersistenceReduxSaga } from "../src/4_services/persistence/PersistenceReduxSaga";

function boxedQueryAction(): PersistenceAction {
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
  } as PersistenceAction;
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

describe("PersistenceReduxSaga query hop spans", () => {
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

  it("handlePersistenceActionForLocalCache logs saga.localCache", async () => {
    const saga = new PersistenceReduxSaga({
      persistenceStoreAccessMode: "remote",
      localPersistenceStoreControllerManager: {} as any,
      remotePersistenceStoreRestClient: {} as any,
    });
    (saga as any).localCache = {
      runBoxedExtractorOrQueryAction: () => ({
        status: "ok",
        returnedDomainElement: { books: [1, 2, 3, 4, 5] },
      }),
    };
    const { lines, restore } = captureConsoleLog();
    try {
      await saga.handlePersistenceActionForLocalCache(boxedQueryAction(), {});
    } finally {
      restore();
    }
    const enter = lines.find((line) => line.includes("→ saga.localCache"));
    const exit = lines.find((line) => line.includes("← saga.localCache"));
    expect(enter).toBeDefined();
    expect(exit).toBeDefined();
    expect(enter!.match(RUN_LOG_PREFIX_PATTERN)?.[2]).toBe(
      exit!.match(RUN_LOG_PREFIX_PATTERN)?.[2],
    );
  });

  it("handlePersistenceActionForRemoteStore logs saga.remote for a query", async () => {
    const saga = new PersistenceReduxSaga({
      persistenceStoreAccessMode: "remote",
      localPersistenceStoreControllerManager: {} as any,
      remotePersistenceStoreRestClient: {} as any,
    });
    (saga as any).localCache = {
      dispatchToReduxStore: async () => ({
        status: "ok",
        returnedDomainElement: { books: [1, 2, 3, 4, 5] },
      }),
    };
    const { lines, restore } = captureConsoleLog();
    try {
      await saga.handlePersistenceActionForRemoteStore(boxedQueryAction(), {});
    } finally {
      restore();
    }
    const enter = lines.find((line) => line.includes("→ saga.remote"));
    const exit = lines.find((line) => line.includes("← saga.remote"));
    expect(enter).toBeDefined();
    expect(exit).toBeDefined();
    expect(enter!.match(RUN_LOG_PREFIX_PATTERN)?.[2]).toBe(
      exit!.match(RUN_LOG_PREFIX_PATTERN)?.[2],
    );
  });

  it("handlePersistenceActionForRemoteStore does not log saga.remote for rollback", async () => {
    const saga = new PersistenceReduxSaga({
      persistenceStoreAccessMode: "remote",
      localPersistenceStoreControllerManager: {} as any,
      remotePersistenceStoreRestClient: {} as any,
    });
    (saga as any).localCache = {
      dispatchToReduxStore: async () => ({ status: "ok" }),
    };
    const { lines, restore } = captureConsoleLog();
    try {
      await saga.handlePersistenceActionForRemoteStore(
        { actionType: "rollback", endpoint: "x", payload: {} } as PersistenceAction,
        {},
      );
    } finally {
      restore();
    }
    expect(lines.some((line) => line.includes("saga.remote"))).toBe(false);
  });
});
