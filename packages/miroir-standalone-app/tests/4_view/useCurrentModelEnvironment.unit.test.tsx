import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import React, { useEffect } from "react";
import { configureStore, type Store } from "@reduxjs/toolkit";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
} from "miroir-test-app_deployment-library";
import {
  getSchemaForDeployment,
  instanceEndpointV1,
  MiroirActivityTracker,
  MiroirEventService,
  miroirFundamentalJzodSchema,
  selfApplicationMiroir,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type EntityInstance,
} from "miroir-core";
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
import {
  addEndpointToLocalCacheState,
  buildMinimalLocalCacheStateForDeployment,
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
}: {
  store: Store;
  children: React.ReactNode;
}) {
  return (
    <LocalCacheProvider store={store}>
      <MiroirContextReactProvider
        miroirContext={miroirContext}
        domainController={{} as DomainControllerInterface}
      >
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

  it("returns an environment whose schema matches getSchemaForDeployment for the Miroir deployment", async () => {
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
        getSchemaForDeployment(deployment_Miroir.uuid, capturedEnv!.currentModel),
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

  it("updates context cache when currentModel changes for the same deployment", async () => {
    const schemaSpy = vi.spyOn(
      await import("miroir-core"),
      "getSchemaForDeployment",
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
      expect(schemaSpy.mock.calls.length).toBeGreaterThan(callsAfterMount);
      expect(capturedContext?.schemasPerDeployment[deployment_Miroir.uuid]).toBe(
        miroirFundamentalJzodSchema,
      );
    });
  });
});
