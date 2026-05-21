declare global { interface Window { process?: any } }

import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";

import {
  ConfigurationService,
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
import { PageDispatcher } from "./PageDispatcher.js";
import { packageName } from "./constants.js";
import { cleanLevel } from "./4_view/constants.js";
import { miroirDemoAppStartup } from "./startup.js";
import { ADMIN_DEPLOYMENT_UUID, demoBundledData, MIROIR_DEPLOYMENT_UUID } from "./bundledData.js";

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
const demoMiroirConfig: MiroirConfigClient = {
  miroirConfigType: "client",
  client: {
    emulateServer: true,
    rootApiUrl: "http://localhost:3080",
    filesystemDeploymentRootDirectory: "no-filesystem-in-demo",
    deploymentStorageConfig: {
      [MIROIR_DEPLOYMENT_UUID]: {
        admin: { emulatedServerType: "bundled", deploymentUuid: MIROIR_DEPLOYMENT_UUID },
        model: { emulatedServerType: "bundled", deploymentUuid: MIROIR_DEPLOYMENT_UUID },
        data:  { emulatedServerType: "bundled", deploymentUuid: MIROIR_DEPLOYMENT_UUID },
      },
      [ADMIN_DEPLOYMENT_UUID]: {
        admin: { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
        model: { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
        data:  { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// MUI theme (minimal)
// ---------------------------------------------------------------------------
const theme = createTheme({});

// ---------------------------------------------------------------------------
// Hash router: single catch-all route, PageDispatcher handles query params
// ---------------------------------------------------------------------------
const router = createHashRouter([
  {
    path: "*",
    element: <PageDispatcher />,
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

  log.info("startDemoApp: domain controllers ready");

  root.render(
    <StrictMode>
      <ThemeProvider theme={theme}>
        <StyledEngineProvider injectFirst>
          <LocalCacheProvider store={domainControllerForClient.getLocalCache().getInnerStore()}>
            <MiroirContextReactProvider
              miroirContext={miroirContext}
              domainController={domainControllerForClient}
            >
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
