declare global { interface Window { process?: any } }

import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";

import {
  ConfigurationService,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  expect,
  LoggerInterface,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirConfigForClientStub,
  MiroirContext,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  RestClientStub,
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
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController,
} from "miroir-react";

import { loglevelnext } from './loglevelnextImporter.js';
import { DemoInitializer } from "./DemoInitializer.js";
import { PageDispatcher } from "./PageDispatcher.js";
import { packageName } from "./constants.js";
import { cleanLevel } from "./4_view/constants.js";
import { miroirDemoAppStartup } from "./startup.js";
import { ADMIN_DEPLOYMENT_UUID, demoBundledData, demoMiroirConfig, MIROIR_DEPLOYMENT_UUID } from "./bundledData.js";
import { RootComponent } from "@miroir-app/miroir-fwk/4_view/components/Page/RootComponent.js";
import { ErrorPage } from "@miroir-app/miroir-fwk/4_view/ErrorPage.js";
import { deployment_Admin, deployment_Miroir } from "miroir-test-app_deployment-admin";

// ---------------------------------------------------------------------------
// Logger setup
// ---------------------------------------------------------------------------
const specificLoggerOptions: SpecificLoggerOptionsMap = {};

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "index.tsx"), "UI",
).then((logger: LoggerInterface) => { log = logger });

// ---------------------------------------------------------------------------
// Miroir Demo configuration
// All deployments use bundled (read-only, in-memory) stores.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// MUI theme (minimal)
// ---------------------------------------------------------------------------
const theme = createTheme({});

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
  miroirCoreStartup();

  // Register bundled stores (read-only, pre-loaded with deployment data)
  miroirBundledStoreSectionStartup(
    ConfigurationService.configurationService,
    demoBundledData,
  );

  // Register IndexedDB stores for any dynamically-created user deployments
  miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);

  const miroirContext = new MiroirContext(
    miroirActivityTracker,
    miroirEventService,
    demoMiroirConfig,
  );

  // Narrow to the stub (emulateServer: true) branch of the union
  const clientStubConfig = demoMiroirConfig.client as MiroirConfigForClientStub;

  // In emulateServer mode the RestClientStub routes HTTP-shaped calls
  // in-process to a server-side domain controller.
  const restClient = new RestClientStub(clientStubConfig.rootApiUrl);
  const persistenceStoreRestClient = new RestPersistenceClientAndRestClient(
    clientStubConfig.rootApiUrl,
    restClient,
  );

  // Client-side domain controller (remote access via stub)
  const persistenceStoreControllerManagerForClient = new PersistenceStoreControllerManager(
    ConfigurationService.configurationService.adminStoreFactoryRegister,
    ConfigurationService.configurationService.StoreSectionFactoryRegister,
  );
  const domainControllerForClient = await setupMiroirDomainController(
    miroirContext,
    {
      persistenceStoreAccessMode: "remote",
      localPersistenceStoreControllerManager: persistenceStoreControllerManagerForClient,
      remotePersistenceStoreRestClient: persistenceStoreRestClient,
    },
  );

  // Server-side domain controller (local access via bundled stores)
  const persistenceStoreControllerManagerForServer = new PersistenceStoreControllerManager(
    ConfigurationService.configurationService.adminStoreFactoryRegister,
    ConfigurationService.configurationService.StoreSectionFactoryRegister,
    clientStubConfig.filesystemDeploymentRootDirectory,
  );
  const domainControllerForServer = await setupMiroirDomainController(
    miroirContext,
    {
      persistenceStoreAccessMode: "local",
      localPersistenceStoreControllerManager: persistenceStoreControllerManagerForServer,
    },
  );

  restClient.setServerDomainController(domainControllerForServer);
  restClient.setPersistenceStoreControllerManager(persistenceStoreControllerManagerForServer);

  log.info("startDemoApp: domain controllers ready, opening admin and miroir deployments");

    //   [MIROIR_DEPLOYMENT_UUID]: {
    //   admin: { emulatedServerType: "bundled", deploymentUuid: MIROIR_DEPLOYMENT_UUID },
    //   model: { emulatedServerType: "bundled", deploymentUuid: MIROIR_DEPLOYMENT_UUID },
    //   data:  { emulatedServerType: "bundled", deploymentUuid: MIROIR_DEPLOYMENT_UUID },
    // },
    // [ADMIN_DEPLOYMENT_UUID]: {
    //   admin: { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
    //   model: { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
    //   data:  { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
    // },

  const configurations: Record<string, Deployment> = {
    [ADMIN_DEPLOYMENT_UUID]: {
      ...deployment_Admin,
      configuration: (demoMiroirConfig as any).client.deploymentStorageConfig[
        ADMIN_DEPLOYMENT_UUID
      ],
    } as Deployment,
    [MIROIR_DEPLOYMENT_UUID]: {
      ...deployment_Miroir,
      configuration: (demoMiroirConfig as any).client.deploymentStorageConfig[
        MIROIR_DEPLOYMENT_UUID
      ],
    } as Deployment,
    // [ADMIN_DEPLOYMENT_UUID]: (demoMiroirConfig as any).client.deploymentStorageConfig[ADMIN_DEPLOYMENT_UUID] as Deployment,
    // [MIROIR_DEPLOYMENT_UUID]: (demoMiroirConfig as any).client.deploymentStorageConfig[MIROIR_DEPLOYMENT_UUID] as Deployment,
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
            >
              {/* Auto-fetch Miroir & App configurations on startup */}
              <DemoInitializer />
              <RouterProvider router={router} />
            </MiroirContextReactProvider>
          </LocalCacheProvider>
        </StyledEngineProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

startDemoApp().catch((err) => {
  console.error("startDemoApp failed:", err);
  root.render(
    <div style={{ padding: 32, color: "red" }}>
      <h2>Fatal startup error</h2>
      <pre>{String(err)}</pre>
    </div>,
  );
});
