import express, { Request } from 'express';

// import { fetch } from 'cross-fetch';

import {
  ConfigurationService,
  LoggerFactoryInterface,
  LoggerInterface,
  MiroirConfigServer,
  MiroirContext,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  SpecificLoggerOptionsMap,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  // adminConfigurationDeploymentTest1,
  defaultLevels,
  miroirCoreStartup,
  restServerDefaultHandlers
} from "miroir-core";

import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';

import { readFileSync } from 'fs';
import log from 'loglevelnext'; // TODO: use this? or plain "console" log?
import { setupMiroirDomainController } from 'miroir-localcache-redux';

const packageName = "server"
const cleanLevel = "5"

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  "4_miroir-core_RestTools": {level:defaultLevels.INFO, },
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined},
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
app.use(express.json({limit: '50mb'}));
myLogger.info(`Server being set-up, going to execute on the port::${portFromConfig}`);

miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();

MiroirLoggerFactory.startRegisteredLoggers(
  loglevelnext,
  (defaultLevels as any)[(miroirConfig as any).server.defaultLevel],
  (miroirConfig as any).server.defaultTemplate,
  (miroirConfig as any).server.specificLoggerOptions
);

const miroirContext = new MiroirContext(miroirConfig);

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
    actionType: "storeManagementAction",
    actionName: "openStore",
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
    async (request: Request<{}, any, any, any, Record<string, any>>, response: any, context: any) => {
      const body = request.body;

      try {
        const result = await op.handler(
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
        return result;
      } catch (error) {
        myLogger.error("server could not handle action: " + op.method + " on URL: " + op.url + " error: " + error)
      }
    }
  );
}

// ##############################################################################################
app.get('/', (req,res) => {
  res.send('App Works !!!!');
});
    
// ##############################################################################################
app.listen(portFromConfig, () => {
    myLogger.info(`Server listening on the port::${portFromConfig}`);
});