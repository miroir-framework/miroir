import express, { Request } from 'express';

import { fetch } from 'cross-fetch';

import {
  ConfigurationService,
  LoggerFactoryInterface,
  LoggerInterface,
  MiroirConfigServer,
  MiroirLoggerFactory,
  SpecificLoggerOptionsMap,
  StoreControllerManager,
  defaultLevels,
  getLoggerName,
  miroirCoreStartup,
  restServerDefaultHandlers
} from "miroir-core";

import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';

import { readFileSync } from 'fs';
import log from 'loglevelnext';
import { createReduxStoreAndPersistenceClient } from 'miroir-localcache-redux';

const packageName = "server"
const cleanLevel = "5"

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  "4_miroir-core_RestTools": {level:defaultLevels.INFO, },
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined},
}

const loglevelnext: LoggerFactoryInterface = log as any as LoggerFactoryInterface;

MiroirLoggerFactory.setEffectiveLoggerFactory(
  loglevelnext,
  defaultLevels.INFO,
  "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions,
);



const loggerName: string = getLoggerName(packageName, cleanLevel,"Server");
let myLogger:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    myLogger = value;
  }
);

const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server.json', import.meta.url)).toString());


const miroirConfig:MiroirConfigServer = configFileContents as MiroirConfigServer;
myLogger.info('miroirConfig',miroirConfig)

const portFromConfig: number = Number(miroirConfig.server.rootApiUrl.substring(miroirConfig.server.rootApiUrl.lastIndexOf(":") + 1));


const app = express();
app.use(express.json());
myLogger.info(`Server being set-up, going to execute on the port::${portFromConfig}`);

miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();


const { reduxStore: mReduxStore } = await createReduxStoreAndPersistenceClient("", fetch);

const storeControllerManager = new StoreControllerManager(
  ConfigurationService.adminStoreFactoryRegister,
  ConfigurationService.StoreSectionFactoryRegister,
  mReduxStore
);

// ##############################################################################################
// CREATING ENDPOINTS SERVICING CRUD HANDLERS
for (const op of restServerDefaultHandlers) {
  (app as any)[op.method](
    op.url,
    async (request: Request<{}, any, any, any, Record<string, any>>, response: any, context: any) => {
      const body = request.body;

      const result = await op.handler(
        (response: any) => response.json.bind(response),
        response,
        storeControllerManager,
        op.method,
        request.originalUrl,
        body,
        request.params
      );
      return result;
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