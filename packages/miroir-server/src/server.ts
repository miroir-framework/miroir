import express, { Request } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
// import {bodyParser} from 'body-parser';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import log from 'loglevelnext'; // TODO: use this? or plain "console" log?

// import { fetch } from 'cross-fetch';

import {
  ConfigurationService,
  LoggerFactoryInterface,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  MiroirConfigServer,
  MiroirContext,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  SpecificLoggerOptionsMap,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  circularReplacer,
  // adminConfigurationDeploymentTest1,
  adminConfigurationDeploymentParis,
  defaultLevels,
  defaultLibraryAppModel,
  defaultMiroirMetaModel,
  miroirCoreStartup,
  miroirFundamentalJzodSchema,
  restServerDefaultHandlers,
  type JzodSchema,
  type MiroirModelEnvironment,
  type InstanceAction,
  entityDeployment,
  defaultMetaModelEnvironment,
  Action2Error,
  type Deployment,
  defaultSelfApplicationDeploymentMap,
  adminSelfApplication} from "miroir-core";

import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { setupMiroirDomainController } from 'miroir-localcache-redux';

const packageName = "server"
const cleanLevel = "5"

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  "4_miroir-core_RestTools": {level:defaultLevels.INFO, },
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined},
}
const loggerOptions: LoggerOptions = {
  defaultLevel: "INFO",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  // context: undefined,
  specificLoggerOptions: specificLoggerOptions,
}

const loglevelnext: LoggerFactoryInterface = log as any as LoggerFactoryInterface;

// MiroirLoggerFactory.setEffectiveLoggerFactoryWithLogLevelNext(
//   loglevelnext,
//   defaultLevels.INFO,
//   "[{{time}}] {{level}} ({{name}}) -",
//   specificLoggerOptions,
// );

const configurations: Record<string, Deployment> = {
  [adminConfigurationDeploymentAdmin.uuid]: adminConfigurationDeploymentAdmin as Deployment,
  [adminConfigurationDeploymentMiroir.uuid]: adminConfigurationDeploymentMiroir as Deployment,
  // [adminConfigurationDeploymentLibrary.uuid]: adminConfigurationDeploymentLibrary.configuration as StoreUnitConfiguration,
  // [adminConfigurationDeploymentParis.uuid]: adminConfigurationDeploymentParis.configuration as StoreUnitConfiguration,
  // // [adminConfigurationDeploymentTest1.uuid]: adminConfigurationDeploymentTest1.configuration as StoreUnitConfiguration,
}


let myLogger: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Server")
).then((logger: LoggerInterface) => {myLogger = logger});

const configFileContents = JSON.parse(
  readFileSync(new URL("../config/miroirConfig.server.json", import.meta.url)).toString()
);


const miroirConfig:MiroirConfigServer = configFileContents as MiroirConfigServer;
myLogger.info('miroirConfig',miroirConfig)

const portFromConfig: number = Number(miroirConfig.server.rootApiUrl.substring(miroirConfig.server.rootApiUrl.lastIndexOf(":") + 1));


const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your client URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({limit: '50mb'}));
// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// // create application/json parser
// var jsonParser = bodyParser.json({limit: '50mb'});
 
// // create application/x-www-form-urlencoded parser
// var urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '50mb' });

myLogger.info(`Server being set-up, going to execute on the port::${portFromConfig}`);

// Serve static assets (images, etc.) from a `public` directory.
// The mount path may be configured in the miroir server config under `server.assetsMountPath`.
// Default to `/assets` so files in `packages/miroir-server/public/...` are available at `/<assetsMountPath>/...`.
const rawAssetsMountPath = (miroirConfig.server && (miroirConfig.server as any).assetsMountPath) || '/assets';
// sanitize mount path: ensure leading slash and no trailing slash (unless root)
let assetsMountPath = String(rawAssetsMountPath || '/assets');
if (!assetsMountPath.startsWith('/')) assetsMountPath = '/' + assetsMountPath;
if (assetsMountPath.length > 1 && assetsMountPath.endsWith('/')) assetsMountPath = assetsMountPath.replace(/\/+$|\/+$/g, '');

// Resolve a Windows-safe absolute path to the public folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathToPublic = path.join(__dirname, '..', 'public');
myLogger.info(`Mounting static assets at ${assetsMountPath} -> ${pathToPublic}`);

// quick existence check for common file to help debugging
try {
  const sample = path.join(pathToPublic, 'images', 'logo.png');
  const exists = existsSync(sample);
  myLogger.info(`Static asset sample check: ${sample} exists=${exists}`);
} catch (e) {
  myLogger.warn(`Error while checking sample static asset: ${e}`);
}

// set long cache headers for static assets (1 day) and fall back to no-cache for HTML-like responses
app.use(
  assetsMountPath,
  express.static(pathToPublic, {
    maxAge: "1d",
    // express.static expects a Node http.ServerResponse here; using that type ensures setHeader is available
    setHeaders: (
      res: import("http").ServerResponse,
      filePath: string,
      stat: import("fs").Stats
    ) => {
      // If it's an HTML file, don't cache
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  })
);

miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

// const serverModelEnvironments: Record<string, MiroirModelEnvironment> = {
//   [adminConfigurationDeploymentMiroir.uuid]: {
//     miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as JzodSchema,
//     miroirMetaModel: defaultMiroirMetaModel,
//     currentModel: defaultMiroirMetaModel,
//     deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
//   },
//   [adminConfigurationDeploymentLibrary.uuid]: {
//     miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as JzodSchema,
//     miroirMetaModel: defaultMiroirMetaModel,
//     currentModel: defaultLibraryAppModel,
//     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
//   }
// };
await MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions
  // (defaultLevels as any)[(miroirConfig as any).server.defaultLevel],
  // (miroirConfig as any).server.defaultTemplate,
  // (miroirConfig as any).server.specificLoggerOptions
);


const miroirContext = new MiroirContext(
  miroirActivityTracker,
  miroirEventService,
  miroirConfig
);

const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
  ConfigurationService.adminStoreFactoryRegister,
  ConfigurationService.StoreSectionFactoryRegister,
);

const domainController = await setupMiroirDomainController(
  miroirContext, 
  {
    persistenceStoreAccessMode: "local",
    localPersistenceStoreControllerManager: persistenceStoreControllerManager
  }
); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.

// open all configured stores
for (const c of Object.entries(configurations)) {
  const openStoreAction: StoreOrBundleAction = {
    actionType: "storeManagementAction_openStore",
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
    payload: {
      application: c[1].adminApplication,
      deploymentUuid: c[0],
      configuration: {
        [c[0]]: c[1].configuration as StoreUnitConfiguration,
      },
    },
  };
  await domainController.handleAction(
    openStoreAction,
    defaultSelfApplicationDeploymentMap,
    defaultMetaModelEnvironment
  );
}

// const fetchDeploymentsAction: InstanceAction = {
//   actionType: "getInstances",
//   endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//   deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
//   payload: {
//     applicationSection: "data",
//     parentUuid: entityDeployment.uuid,
//   }
// }

// const deployments = await domainController.handleAction(fetchDeploymentsAction);
const deploymentsQueryResults = await domainController.handleBoxedExtractorOrQueryAction({
  actionType: "runBoxedExtractorOrQueryAction",
  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  payload: {
    application: adminSelfApplication.uuid,
    deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
    applicationSection: "data",
    queryExecutionStrategy: "storage",
    query: {
      application: adminSelfApplication.uuid,
      applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
      deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      pageParams: {},
      queryParams: {},
      contextResults: {},
      // runAsSql: true,
      extractors: {
        deployments: {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          parentUuid: entityDeployment.uuid,
        }
      }
    },
  }
}, defaultSelfApplicationDeploymentMap, defaultMetaModelEnvironment);

if (deploymentsQueryResults instanceof Action2Error) {
  throw new Error(`Error fetching deployments: ${deploymentsQueryResults.errorMessage}`);
}

const deployments: Deployment[] = deploymentsQueryResults.returnedDomainElement.deployments;

myLogger.info(`Deployments fetched: ${JSON.stringify(deployments, circularReplacer(), 2)}`);

const deploymentsToOpen: [string, Deployment][] = deployments
  .filter((d) => !configurations[d.uuid.toString()])
  .map((d) => [d.uuid.toString(), d]);

myLogger.info(`Deployments to open: ${JSON.stringify(deploymentsToOpen, circularReplacer(), 2)}`);

for (const c of deploymentsToOpen) {
  const openStoreAction: StoreOrBundleAction = {
    actionType: "storeManagementAction_openStore",
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
    payload: {
      application: c[1].adminApplication,
      deploymentUuid: c[0],
      configuration: {
        [c[0]]: c[1].configuration as StoreUnitConfiguration,
      },
    },
  };
  await domainController.handleAction(
    openStoreAction,
    defaultSelfApplicationDeploymentMap,
    defaultMetaModelEnvironment
  );
}

// ##############################################################################################
// CREATING ENDPOINTS SERVICING CRUD HANDLERS
for (const op of restServerDefaultHandlers) {
  const operationHandler = async (request: CustomRequest, response: any, context: any) => {
    const body = request.body;
    myLogger.info(`[CONSOLE DEBUG] Request received: ${op.method} ${request.originalUrl}`);
    myLogger.info(
      `[REQUEST START] ${op.method} ${request.originalUrl} - params:`,
      JSON.stringify(request.params)
    );

    try {
      myLogger.info(`[CONSOLE DEBUG] About to call handler`);
      myLogger.info(
        `[BEFORE HANDLER] About to call handler for ${op.method} ${request.originalUrl}`
      );

      await op.handler(
        true, // useDomainControllerToHandleModelAndInstanceActions: since we're on the server, we use the localCache as intermediate step, to access the persistenceStore
        (response: any) => response.json.bind(response),
        response,
        persistenceStoreControllerManager,
        domainController,
        op.method,
        request.originalUrl,
        body,
        request.params
      );

      myLogger.info(`[CONSOLE DEBUG] Handler completed successfully`);
      myLogger.info(
        `[AFTER HANDLER] Handler completed successfully for ${op.method} ${request.originalUrl}`
      );
      // Don't return anything - the handler should have already sent the response
    } catch (error) {
      myLogger.info(`[CONSOLE DEBUG] Error caught:`, error);
      myLogger.error(
        `[ERROR CAUGHT] server could not handle action: ${op.method} on URL: ${op.url} error: ${error}`
      );

      // Send proper error response to client
      if (!response.headersSent) {
        myLogger.info(`[CONSOLE DEBUG] Sending error response`);
        myLogger.info(
          `[SENDING ERROR RESPONSE] Headers not sent, sending 500 error response for ${request.originalUrl}`
        );
        const errorMessage = error instanceof Error ? error.message : String(error);
        try {
          response.status(500).json({
            status: "error",
            errorType: "ServerError",
            errorMessage: `Failed to handle ${op.method} request on ${request.originalUrl}: ${errorMessage}`,
            timestamp: new Date().toISOString(),
          });
          myLogger.info(`[CONSOLE DEBUG] Error response sent successfully`);
          myLogger.info(
            `[ERROR RESPONSE SENT] Error response sent successfully for ${request.originalUrl}`
          );
        } catch (responseError) {
          myLogger.info(`[CONSOLE DEBUG] Failed to send error response:`, responseError);
          myLogger.error(
            `[ERROR SENDING RESPONSE] Failed to send error response: ${responseError}`
          );
        }
      } else {
        myLogger.info(`[CONSOLE DEBUG] Headers already sent, cannot send error response`);
        myLogger.warn(
          `[HEADERS ALREADY SENT] Cannot send error response for ${request.originalUrl} - headers already sent`
        );
      }
      // Don't return anything - we've already handled the response
    }
  };

  (app as any)[op.method](
    op.url,
    operationHandler,
  );
}

// ##############################################################################################
app.get('/', (req: any,res: any) => {
  res.send('App Works !!!!');
});
    
// ##############################################################################################
app.listen(portFromConfig, () => {
    myLogger.info(`Server listening on the port::${portFromConfig}`);
});

// Adjust Request type
interface CustomRequest extends Request {
  body: any;
  originalUrl: string;
  params: Record<string, any>;
}