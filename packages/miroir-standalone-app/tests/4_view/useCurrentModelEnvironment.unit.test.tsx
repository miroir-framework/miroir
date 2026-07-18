import { describe, expect, it, vi, afterEach } from "vitest";
import { render, renderHook, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import React, { useEffect } from "react";
import { configureStore, type Store } from "@reduxjs/toolkit";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  book1,
} from "miroir-test-app_deployment-library";
import {
  getMiroirFundamentalSchemaForDeployment,
  instanceEndpointV1,
  MiroirActivityTracker,
  MiroirEventService,
  miroirFundamentalJzodSchema,
  resolveFundamentalSchemaForDeployment,
  selfApplicationMiroir,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type EntityInstance,
} from "miroir-core";
import { LocalCache } from "miroir-localcache-redux";
import {
  LocalCacheProvider,
  MiroirContextReactProvider,
  reduxStoreWithUndoRedoGetInitialState,
  useMiroirContextService,
  type LocalCacheSliceState,
  type MiroirReactContext,
  type ReduxStateWithUndoRedo,
} from "miroir-react";

import { useCurrentModelEnvironment } from "../../src/miroir-fwk/4_view/ReduxHooks.js";
import { ModelEnvironmentSync } from "../../src/miroir-fwk/4_view/ModelEnvironmentSync.js";
import {
  addEndpointToLocalCacheState,
  addEntityInstanceToLocalCacheState,
  buildMinimalLocalCacheStateForDeployment,
  mutateEntityDescriptionInLocalCacheState,
} from "../helpers/minimalLocalCacheStateForModel.js";

const TEST_UPDATE_PRESENT_MODEL = "TEST_UPDATE_PRESENT_MODEL";

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
const miroirContext = {
  miroirActivityTracker,
  miroirEventService,
  extendMiroirConfigWithExtraDeploymentConfiguration: () => undefined,
};

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [selfApplicationMiroir.uuid]: deployment_Miroir.uuid,
  [defaultLibraryAppModel.applicationUuid]: deployment_Library_DO_NO_USE.uuid,
};

function createTestStore(initialSlice: LocalCacheSliceState): Store {
  const baseState: ReduxStateWithUndoRedo = reduxStoreWithUndoRedoGetInitialState(() => initialSlice);
  baseState.presentModelSnapshot = initialSlice;

  return configureStore({
    reducer: {
      presentModelSnapshot: (state = baseState.presentModelSnapshot, action: any) => {
        if (action.type === TEST_UPDATE_PRESENT_MODEL) {
          return action.payload as LocalCacheSliceState;
        }
        return state;
      },
      currentTransaction: (state = baseState.currentTransaction) => state,
      previousModelSnapshot: (state = baseState.previousModelSnapshot) => state,
      pastModelPatches: (state = baseState.pastModelPatches) => state,
      futureModelPatches: (state = baseState.futureModelPatches) => state,
      queriesResultsCache: (state = baseState.queriesResultsCache) => state,
    },
    preloadedState: baseState,
  });
}

function TestProviders({
  store,
  children,
  syncApplications,
}: {
  store: Store;
  children: React.ReactNode;
  /** When set, mounts ModelEnvironmentSync for these apps (Proposal 3). */
  syncApplications?: string[];
}) {
  return (
    <LocalCacheProvider store={store}>
      <MiroirContextReactProvider
        miroirContext={miroirContext}
        domainController={{} as DomainControllerInterface}
      >
        {syncApplications && syncApplications.length > 0 ? (
          <ModelEnvironmentSync
            applicationDeploymentMap={applicationDeploymentMap}
            applicationsToSync={syncApplications}
          />
        ) : null}
        {children}
      </MiroirContextReactProvider>
    </LocalCacheProvider>
  );
}

function ContextProbe({ onContext }: { onContext: (ctx: MiroirReactContext) => void }) {
  const ctx = useMiroirContextService();
  useEffect(() => {
    onContext(ctx);
  }, [ctx, onContext]);
  return null;
}

function ModelEnvironmentProbe({
  application,
  onEnvironment,
  onContext,
}: {
  application: string;
  onEnvironment?: (env: ReturnType<typeof useCurrentModelEnvironment>) => void;
  onContext?: (ctx: MiroirReactContext) => void;
}) {
  const env = useCurrentModelEnvironment(application, applicationDeploymentMap);
  useEffect(() => {
    onEnvironment?.(env);
  }, [env, onEnvironment]);
  return (
    <>
      {onContext && <ContextProbe onContext={onContext} />}
      <span data-testid="endpoint-count">{env.currentModel.endpoints.length}</span>
    </>
  );
}

describe("useCurrentModelEnvironment (Phase 1)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an environment whose schema matches getMiroirFundamentalSchemaForDeployment for the Miroir deployment", async () => {
    const store = createTestStore(
      buildMinimalLocalCacheStateForDeployment(deployment_Miroir.uuid, "data"),
    );

    let capturedEnv: ReturnType<typeof useCurrentModelEnvironment> | undefined;

    render(
      <ModelEnvironmentProbe
        application={selfApplicationMiroir.uuid}
        onEnvironment={(env) => {
          capturedEnv = env;
        }}
      />,
      {
        wrapper: ({ children }) => <TestProviders store={store}>{children}</TestProviders>,
      },
    );

    await waitFor(() => {
      expect(capturedEnv).toBeDefined();
      expect(capturedEnv!.miroirFundamentalJzodSchema).toBe(
        getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, capturedEnv!.currentModel),
      );
      expect(capturedEnv!.miroirFundamentalJzodSchema).toBe(miroirFundamentalJzodSchema);
    });
  });

  it("populates schemasPerDeployment in context when the hook mounts", async () => {
    const store = createTestStore(
      buildMinimalLocalCacheStateForDeployment(deployment_Miroir.uuid, "data"),
    );

    let capturedContext: MiroirReactContext | undefined;

    render(
      <ModelEnvironmentProbe
        application={selfApplicationMiroir.uuid}
        onContext={(ctx) => {
          capturedContext = ctx;
        }}
      />,
      {
        wrapper: ({ children }) => <TestProviders store={store}>{children}</TestProviders>,
      },
    );

    await waitFor(() => {
      expect(capturedContext?.schemasPerDeployment[deployment_Miroir.uuid]).toBe(
        miroirFundamentalJzodSchema,
      );
    });
  });

  it("sets schemaReloadRequired when schemaRevision changes for meta endpoint add", async () => {
    const schemaSpy = vi.spyOn(
      await import("miroir-core"),
      "getMiroirFundamentalSchemaForDeployment",
    );

    const emptySlice = buildMinimalLocalCacheStateForDeployment(deployment_Miroir.uuid, "data");
    const store = createTestStore(emptySlice);

    let capturedContext: MiroirReactContext | undefined;

    render(
      <ModelEnvironmentProbe
        application={selfApplicationMiroir.uuid}
        onContext={(ctx) => {
          capturedContext = ctx;
        }}
      />,
      {
        wrapper: ({ children }) => <TestProviders store={store}>{children}</TestProviders>,
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("endpoint-count")).toHaveTextContent("0");
      expect(capturedContext?.schemasPerDeployment[deployment_Miroir.uuid]).toBeDefined();
    });

    const callsAfterMount = schemaSpy.mock.calls.length;

    act(() => {
      store.dispatch({
        type: TEST_UPDATE_PRESENT_MODEL,
        payload: addEndpointToLocalCacheState(
          emptySlice,
          deployment_Miroir.uuid,
          "data",
          { uuid: instanceEndpointV1.uuid! },
        ),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("endpoint-count")).toHaveTextContent("1");
      expect(capturedContext?.schemaReloadRequired).toBe(true);
      expect(schemaSpy.mock.calls.length).toBe(callsAfterMount);
      expect(capturedContext?.schemasPerDeployment[deployment_Miroir.uuid]).toBe(
        miroirFundamentalJzodSchema,
      );
    });
  });
});

describe("useCurrentModelEnvironment (Phase 2.8 — schema caching)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not recompute schema when model reference is stable", async () => {
    const resolveSpy = vi.spyOn(
      await import("miroir-core"),
      "resolveFundamentalSchemaForDeployment",
    );

    const store = createTestStore(
      buildMinimalLocalCacheStateForDeployment(deployment_Miroir.uuid, "data"),
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestProviders store={store}>{children}</TestProviders>
    );

    const { rerender } = renderHook(
      () => useCurrentModelEnvironment(selfApplicationMiroir.uuid, applicationDeploymentMap),
      { wrapper },
    );

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(0);
    });

    const callCountAfterMount = resolveSpy.mock.calls.length;
    rerender();
    expect(resolveSpy.mock.calls.length).toBe(callCountAfterMount);
  });
});

describe("useCurrentModelEnvironment (Phase 199 — schemaRevision policy)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not call schema resolver when only instance data changes", async () => {
    const resolveSpy = vi.spyOn(
      await import("miroir-core"),
      "resolveFundamentalSchemaForDeployment",
    );

    const librarySlice = addEntityInstanceToLocalCacheState(
      buildMinimalLocalCacheStateForDeployment(deployment_Library_DO_NO_USE.uuid, "model"),
      deployment_Library_DO_NO_USE.uuid,
      book1 as EntityInstance,
    );
    const store = createTestStore(librarySlice);

    renderHook(
      () =>
        useCurrentModelEnvironment(
          defaultLibraryAppModel.applicationUuid,
          applicationDeploymentMap,
        ),
      {
        wrapper: ({ children }) => <TestProviders store={store}>{children}</TestProviders>,
      },
    );

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(0);
    });

    const callsAfterMount = resolveSpy.mock.calls.length;

    act(() => {
      store.dispatch({
        type: TEST_UPDATE_PRESENT_MODEL,
        payload: mutateEntityDescriptionInLocalCacheState(
          librarySlice,
          deployment_Library_DO_NO_USE.uuid,
          "model",
          book1.uuid,
          "Runtime-only change",
        ),
      });
    });

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBe(callsAfterMount);
    });
  });

  it("calls resolver when app endpoint added (app-overlay revision change)", async () => {
    const resolveSpy = vi.spyOn(
      await import("miroir-core"),
      "resolveFundamentalSchemaForDeployment",
    );

    const librarySlice = buildMinimalLocalCacheStateForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      "model",
    );
    const store = createTestStore(librarySlice);

    renderHook(
      () =>
        useCurrentModelEnvironment(
          defaultLibraryAppModel.applicationUuid,
          applicationDeploymentMap,
        ),
      {
        wrapper: ({ children }) => <TestProviders store={store}>{children}</TestProviders>,
      },
    );

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(0);
    });

    const callsAfterMount = resolveSpy.mock.calls.length;

    act(() => {
      store.dispatch({
        type: TEST_UPDATE_PRESENT_MODEL,
        payload: addEndpointToLocalCacheState(
          librarySlice,
          deployment_Library_DO_NO_USE.uuid,
          "model",
          { uuid: "overlay-endpoint-uuid", application: defaultLibraryAppModel.applicationUuid },
        ),
      });
    });

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(callsAfterMount);
      const lastCall = resolveSpy.mock.calls.at(-1);
      expect(lastCall?.[2]).toBe("extended");
    });
  });

  it("does not recompute when unrelated deployment's model changes in map", async () => {
    const resolveSpy = vi.spyOn(
      await import("miroir-core"),
      "resolveFundamentalSchemaForDeployment",
    );

    const librarySlice = buildMinimalLocalCacheStateForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      "model",
    );
    const miroirSlice = buildMinimalLocalCacheStateForDeployment(deployment_Miroir.uuid, "data");
    const store = createTestStore({
      ...librarySlice,
      current: {
        ...librarySlice.current,
        ...miroirSlice.current,
      },
    });

    let capturedLibrarySchema: unknown;

    renderHook(
      () => {
        const env = useCurrentModelEnvironment(
          defaultLibraryAppModel.applicationUuid,
          applicationDeploymentMap,
        );
        capturedLibrarySchema = env.miroirFundamentalJzodSchema;
        return env;
      },
      {
        wrapper: ({ children }) => <TestProviders store={store}>{children}</TestProviders>,
      },
    );

    await waitFor(() => {
      expect(capturedLibrarySchema).toBeDefined();
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(0);
    });

    const callsAfterMount = resolveSpy.mock.calls.length;
    const schemaBeforeAdminMutation = capturedLibrarySchema;

    act(() => {
      store.dispatch({
        type: TEST_UPDATE_PRESENT_MODEL,
        payload: addEndpointToLocalCacheState(
          miroirSlice,
          deployment_Miroir.uuid,
          "data",
          { uuid: instanceEndpointV1.uuid! },
        ),
      });
    });

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBe(callsAfterMount);
      expect(capturedLibrarySchema).toBe(schemaBeforeAdminMutation);
    });
  });

  it("schema for Library application ignores Admin model mutations", async () => {
    const resolveSpy = vi.spyOn(
      await import("miroir-core"),
      "resolveFundamentalSchemaForDeployment",
    );

    const librarySlice = buildMinimalLocalCacheStateForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      "model",
    );
    const miroirSlice = buildMinimalLocalCacheStateForDeployment(deployment_Miroir.uuid, "data");
    const store = createTestStore({
      ...librarySlice,
      current: {
        ...librarySlice.current,
        ...miroirSlice.current,
      },
    });

    let capturedEnv: ReturnType<typeof useCurrentModelEnvironment> | undefined;

    renderHook(
      () => {
        capturedEnv = useCurrentModelEnvironment(
          defaultLibraryAppModel.applicationUuid,
          applicationDeploymentMap,
        );
        return capturedEnv;
      },
      {
        wrapper: ({ children }) => <TestProviders store={store}>{children}</TestProviders>,
      },
    );

    await waitFor(() => {
      expect(capturedEnv?.miroirFundamentalJzodSchema).toBeDefined();
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(0);
    });

    const callsAfterMount = resolveSpy.mock.calls.length;
    const schemaBefore = capturedEnv!.miroirFundamentalJzodSchema;

    act(() => {
      store.dispatch({
        type: TEST_UPDATE_PRESENT_MODEL,
        payload: addEndpointToLocalCacheState(
          miroirSlice,
          deployment_Miroir.uuid,
          "data",
          { uuid: instanceEndpointV1.uuid! },
        ),
      });
    });

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBe(callsAfterMount);
      expect(capturedEnv!.miroirFundamentalJzodSchema).toBe(schemaBefore);
    });
  });

  it("does not call localCache.currentModelEnvironment", async () => {
    const envSpy = vi.spyOn(LocalCache.prototype, "currentModelEnvironment");

    const store = createTestStore(
      buildMinimalLocalCacheStateForDeployment(deployment_Miroir.uuid, "data"),
    );

    renderHook(
      () => useCurrentModelEnvironment(selfApplicationMiroir.uuid, applicationDeploymentMap),
      {
        wrapper: ({ children }) => <TestProviders store={store}>{children}</TestProviders>,
      },
    );

    await waitFor(() => {
      expect(envSpy).not.toHaveBeenCalled();
    });
  });
});

describe("useCurrentModelEnvironment (Phase 6 — performance acceptance)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("invokes at most one extended resolve per deployment on mount until overlay revision change", async () => {
    const resolveSpy = vi.spyOn(
      await import("miroir-core"),
      "resolveFundamentalSchemaForDeployment",
    );

    const librarySlice = buildMinimalLocalCacheStateForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      "model",
    );
    const store = createTestStore(librarySlice);

    renderHook(
      () =>
        useCurrentModelEnvironment(
          defaultLibraryAppModel.applicationUuid,
          applicationDeploymentMap,
        ),
      {
        wrapper: ({ children }) => <TestProviders store={store}>{children}</TestProviders>,
      },
    );

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(0);
    });

    const extendedCallsAfterMount = resolveSpy.mock.calls.filter(
      (call) =>
        call[0] === deployment_Library_DO_NO_USE.uuid && call[2] === "extended",
    ).length;
    expect(extendedCallsAfterMount).toBeLessThanOrEqual(1);

    const callsAfterMount = resolveSpy.mock.calls.length;

    act(() => {
      store.dispatch({
        type: TEST_UPDATE_PRESENT_MODEL,
        payload: addEndpointToLocalCacheState(
          librarySlice,
          deployment_Library_DO_NO_USE.uuid,
          "model",
          { uuid: "phase6-overlay-endpoint", application: defaultLibraryAppModel.applicationUuid },
        ),
      });
    });

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(callsAfterMount);
    });

    const extendedCallsAfterOverlay = resolveSpy.mock.calls.filter(
      (call) =>
        call[0] === deployment_Library_DO_NO_USE.uuid && call[2] === "extended",
    ).length;
    expect(extendedCallsAfterOverlay).toBe(extendedCallsAfterMount + 1);
  });
});

describe("useCurrentModelEnvironment (Phase 7 — ModelEnvironmentSync)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function ThreeConsumers() {
    useCurrentModelEnvironment(
      defaultLibraryAppModel.applicationUuid,
      applicationDeploymentMap,
    );
    useCurrentModelEnvironment(
      defaultLibraryAppModel.applicationUuid,
      applicationDeploymentMap,
    );
    useCurrentModelEnvironment(
      defaultLibraryAppModel.applicationUuid,
      applicationDeploymentMap,
    );
    return null;
  }

  it("N consumers without Sync still resolve at most once via ensureSchemaForDeployment", async () => {
    const resolveSpy = vi.spyOn(
      await import("miroir-core"),
      "resolveFundamentalSchemaForDeployment",
    );

    const librarySlice = buildMinimalLocalCacheStateForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      "model",
    );
    const store = createTestStore(librarySlice);

    render(<ThreeConsumers />, {
      wrapper: ({ children }) => (
        <TestProviders store={store}>{children}</TestProviders>
      ),
    });

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(0);
    });

    const extendedCalls = resolveSpy.mock.calls.filter(
      (call) =>
        call[0] === deployment_Library_DO_NO_USE.uuid && call[2] === "extended",
    ).length;
    expect(extendedCalls).toBeLessThanOrEqual(1);
  });

  it("ModelEnvironmentSync + N consumers: ≤1 extended resolve; data-only no extra; overlay +1", async () => {
    const resolveSpy = vi.spyOn(
      await import("miroir-core"),
      "resolveFundamentalSchemaForDeployment",
    );

    const librarySlice = addEntityInstanceToLocalCacheState(
      buildMinimalLocalCacheStateForDeployment(deployment_Library_DO_NO_USE.uuid, "model"),
      deployment_Library_DO_NO_USE.uuid,
      book1 as EntityInstance,
    );
    const store = createTestStore(librarySlice);

    render(<ThreeConsumers />, {
      wrapper: ({ children }) => (
        <TestProviders
          store={store}
          syncApplications={[
            selfApplicationMiroir.uuid,
            defaultLibraryAppModel.applicationUuid,
          ]}
        >
          {children}
        </TestProviders>
      ),
    });

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(0);
    });

    const extendedCallsAfterMount = resolveSpy.mock.calls.filter(
      (call) =>
        call[0] === deployment_Library_DO_NO_USE.uuid && call[2] === "extended",
    ).length;
    expect(extendedCallsAfterMount).toBeLessThanOrEqual(1);

    const callsAfterMount = resolveSpy.mock.calls.length;

    act(() => {
      store.dispatch({
        type: TEST_UPDATE_PRESENT_MODEL,
        payload: mutateEntityDescriptionInLocalCacheState(
          librarySlice,
          deployment_Library_DO_NO_USE.uuid,
          "model",
          book1.uuid,
          "Runtime-only change",
        ),
      });
    });

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBe(callsAfterMount);
    });

    act(() => {
      store.dispatch({
        type: TEST_UPDATE_PRESENT_MODEL,
        payload: addEndpointToLocalCacheState(
          librarySlice,
          deployment_Library_DO_NO_USE.uuid,
          "model",
          {
            uuid: "phase7-overlay-endpoint",
            application: defaultLibraryAppModel.applicationUuid,
          },
        ),
      });
    });

    await waitFor(() => {
      expect(resolveSpy.mock.calls.length).toBeGreaterThan(callsAfterMount);
    });

    const extendedCallsAfterOverlay = resolveSpy.mock.calls.filter(
      (call) =>
        call[0] === deployment_Library_DO_NO_USE.uuid && call[2] === "extended",
    ).length;
    expect(extendedCallsAfterOverlay).toBe(extendedCallsAfterMount + 1);
  });
});
