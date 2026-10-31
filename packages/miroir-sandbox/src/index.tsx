declare global { interface Window { process?: any } }

import 'material-symbols/outlined.css';

import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";

import {
  ConfigurationService,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  expect,
  LoggerInterface,
  MiroirActivityTracker,
  MiroirEventService,
  MiroirLoggerFactory,
  SpecificLoggerOptionsMap,
  type Deployment,
  type StoreOrBundleAction,
  type StoreUnitConfiguration,
} from "miroir-core";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirBundledStoreSectionStartup } from "miroir-store-bundled";
import {
  LocalCacheProvider,
  MiroirContextReactProvider,
  PageDispatcher,
  ReportSectionRenderersProvider,
  RootComponent,
  startMiroirClient,
  type ReportSectionRenderers,
} from "miroir-react";

import { loglevelnext } from './loglevelnextImporter.js';
import { DemoInitializer } from "./DemoInitializer.js";
import { packageName } from "./constants.js";
import { cleanLevel } from "./4_view/constants.js";
import { miroirDemoAppStartup } from "./startup.js";
import { ADMIN_DEPLOYMENT_UUID, ADMIN_BUNDLED_CONFIG, ADMIN_MODEL_PARENT_UUIDS_ARRAY, demoBundledData, demoMiroirConfig, MIROIR_DEPLOYMENT_UUID } from "./bundledData.js";
import { migrateAdminToIndexedDbIfNeeded } from "./adminMigration.js";
import { ErrorPage } from "miroir-react";
import { deployment_Admin, deployment_Miroir } from "miroir-app-admin";

// ---------------------------------------------------------------------------
// Logger setup
// ---------------------------------------------------------------------------
const specificLoggerOptions: SpecificLoggerOptionsMap = {};

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "index.tsx");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => { log = logger });

// ---------------------------------------------------------------------------
// Miroir Demo configuration
// Admin deployment uses IndexedDB (writable); Miroir deployment uses bundled
// (read-only, in-memory).  See adminMigration.ts for the copy-on-first-run
// logic.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// MUI theme (minimal)
// ---------------------------------------------------------------------------
const theme = createTheme({});

// ---------------------------------------------------------------------------
// Report sections the sandbox adds to the miroir-react defaults (#633 D3): the
// model diagram comes from miroir-diagram-class, loaded on first display.
// ---------------------------------------------------------------------------
const sandboxReportSectionRenderers: ReportSectionRenderers = {
  modelDiagramReportSection: lazy(async () => ({
    default: (await import("miroir-diagram-class")).ModelDiagramReportSectionView,
  })),
};

// ---------------------------------------------------------------------------
// Hash router: RootComponent provides the layout (AppBar, sidebar);
// PageDispatcher handles all navigation via path segments or ?page= query params.
// ---------------------------------------------------------------------------
const router = createHashRouter([
  {
    path: "/",
    element: <RootComponent />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <PageDispatcher /> },
      {
        path: "*",
        element: <PageDispatcher />,
      },
    ],
  },
]);

// ---------------------------------------------------------------------------
// Application startup
// ---------------------------------------------------------------------------
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  {
    defaultLevel: "INFO",
    defaultTemplate: "[{{time}}] {{level}} {{name}} ### ",
    specificLoggerOptions: {},
  },
);

const container = document.getElementById("root")!;
const root = createRoot(container);

async function startDemoApp() {
  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

  miroirDemoAppStartup();

  // #639: one startup call; bundled stores are read-only and pre-loaded with deployment data,
  // IndexedDB holds the deployments created by the user
  const {
    miroirContext,
    domainController: domainControllerForClient,
    emulatedServer,
    processCapabilities,
  } = await startMiroirClient(demoMiroirConfig, {
    stores: [
      (configurationService) => miroirBundledStoreSectionStartup(configurationService, demoBundledData),
      miroirIndexedDbStoreSectionStartup,
    ],
    activityTracker: miroirActivityTracker,
    eventService: miroirEventService,
  });
  if (!emulatedServer) {
    throw new Error("startDemoApp: the sandbox configuration emulates the server");
  }
  const domainControllerForServer = emulatedServer.domainController;
  const persistenceStoreControllerManagerForServer = emulatedServer.persistenceStoreControllerManager;

  log.info("startDemoApp: domain controllers ready; running admin→IndexedDB migration check");

  // Migrate bundled admin data to IndexedDB on first run (or when ?reset is
  // in the URL).  Returns the config to use for the admin deployment.
  const adminConfig = await migrateAdminToIndexedDbIfNeeded(
    persistenceStoreControllerManagerForServer,
    ADMIN_BUNDLED_CONFIG,
    ADMIN_MODEL_PARENT_UUIDS_ARRAY,
  );

  log.info("startDemoApp: migration done, opening admin and miroir deployments");

  const configurations: Record<string, Deployment> = {
    [ADMIN_DEPLOYMENT_UUID]: {
      ...deployment_Admin,
      configuration: adminConfig,
    } as Deployment,
    [MIROIR_DEPLOYMENT_UUID]: {
      ...deployment_Miroir,
      configuration: (demoMiroirConfig as any).client.deploymentStorageConfig[
        MIROIR_DEPLOYMENT_UUID
      ],
    } as Deployment,
  };
  // open all configured stores
  for (const c of Object.entries(configurations)) {
    const openStoreAction: StoreOrBundleAction = {
      actionType: "storeManagementAction_openStore",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      payload: {
        application: c[1].selfApplication,
        deploymentUuid: c[0],
        configuration: {
          [c[0]]: c[1].configuration as StoreUnitConfiguration,
        },
      },
    };
    await domainControllerForServer.handleAction(
      openStoreAction,
      defaultSelfApplicationDeploymentMap,
      defaultMetaModelEnvironment,
    );
  }

  root.render(
    <StrictMode>
      <ThemeProvider theme={theme}>
        <StyledEngineProvider injectFirst>
          <LocalCacheProvider store={domainControllerForClient.getLocalCache().getInnerStore()}>
            <MiroirContextReactProvider
              miroirContext={miroirContext}
              domainController={domainControllerForClient}
              processCapabilities={processCapabilities}
            >
              {/* Auto-fetch Miroir & App configurations on startup */}
              <DemoInitializer />
              <ReportSectionRenderersProvider renderers={sandboxReportSectionRenderers}>
                <RouterProvider router={router} />
              </ReportSectionRenderersProvider>
            </MiroirContextReactProvider>
          </LocalCacheProvider>
        </StyledEngineProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

startDemoApp().catch((err) => {
  log.error("startDemoApp failed:", err);
  root.render(
    <div style={{ padding: 32, color: "red" }}>
      <h2>Fatal startup error</h2>
      <pre>{String(err)}</pre>
    </div>,
  );
});
