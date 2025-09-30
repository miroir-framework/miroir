import express, { Request } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
// import {bodyParser} from 'body-parser';
import { readFileSync } from 'fs';
import log from 'loglevelnext'; // TODO: use this? or plain "console" log?

// import { fetch } from 'cross-fetch';

import {
  ConfigurationService,
  ConsoleInterceptor,
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
  defaultLevels,
  miroirCoreStartup,
  restServerDefaultHandlers
} from "miroir-core";

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

const configurations = {
  [adminConfigurationDeploymentAdmin.uuid]: adminConfigurationDeploymentAdmin.configuration as StoreUnitConfiguration,
  [adminConfigurationDeploymentMiroir.uuid]: adminConfigurationDeploymentMiroir.configuration as StoreUnitConfiguration,
  [adminConfigurationDeploymentLibrary.uuid]: adminConfigurationDeploymentLibrary.configuration as StoreUnitConfiguration,
  // [adminConfigurationDeploymentTest1.uuid]: adminConfigurationDeploymentTest1.configuration as StoreUnitConfiguration,
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

miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

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
    // actionType: "storeManagementAction",
    actionType: "storeManagementAction_openStore",
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
    configuration: {
      [c[0]]: c[1] as StoreUnitConfiguration,
    },
    deploymentUuid: c[0],
  };
  await domainController.handleAction(openStoreAction)
}


// ##############################################################################################
// CREATING ENDPOINTS SERVICING CRUD HANDLERS
for (const op of restServerDefaultHandlers) {
  (app as any)[op.method](
    op.url,
    // jsonParser,
    // urlencodedParser,
    async (request: CustomRequest, response: any, context: any) => {
      const body = request.body;
      myLogger.info(`[CONSOLE DEBUG] Request received: ${op.method} ${request.originalUrl}`);
      myLogger.info(`[REQUEST START] ${op.method} ${request.originalUrl} - params:`, JSON.stringify(request.params));
      
      try {
        myLogger.info(`[CONSOLE DEBUG] About to call handler`);
        myLogger.info(`[BEFORE HANDLER] About to call handler for ${op.method} ${request.originalUrl}`);
        
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
        myLogger.info(`[AFTER HANDLER] Handler completed successfully for ${op.method} ${request.originalUrl}`);
        // Don't return anything - the handler should have already sent the response
      } catch (error) {
        myLogger.info(`[CONSOLE DEBUG] Error caught:`, error);
        myLogger.error(`[ERROR CAUGHT] server could not handle action: ${op.method} on URL: ${op.url} error: ${error}`);
        
        // Send proper error response to client
        if (!response.headersSent) {
          myLogger.info(`[CONSOLE DEBUG] Sending error response`);
          myLogger.info(`[SENDING ERROR RESPONSE] Headers not sent, sending 500 error response for ${request.originalUrl}`);
          const errorMessage = error instanceof Error ? error.message : String(error);
          try {
            response.status(500).json({
              status: "error",
              errorType: "ServerError",
              errorMessage: `Failed to handle ${op.method} request on ${request.originalUrl}: ${errorMessage}`,
              timestamp: new Date().toISOString()
            });
            myLogger.info(`[CONSOLE DEBUG] Error response sent successfully`);
            myLogger.info(`[ERROR RESPONSE SENT] Error response sent successfully for ${request.originalUrl}`);
          } catch (responseError) {
            myLogger.info(`[CONSOLE DEBUG] Failed to send error response:`, responseError);
            myLogger.error(`[ERROR SENDING RESPONSE] Failed to send error response: ${responseError}`);
          }
        } else {
          myLogger.info(`[CONSOLE DEBUG] Headers already sent, cannot send error response`);
          myLogger.warn(`[HEADERS ALREADY SENT] Cannot send error response for ${request.originalUrl} - headers already sent`);
        }
        // Don't return anything - we've already handled the response
      }
    }
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