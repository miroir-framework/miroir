// import bodyParser from 'body-parser';
import express, { Request } from 'express';

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

import { cleanLevel, packageName } from "./constants";

// import { generateZodSchemaFileFromJzodSchema } from './generateZodSchemaFileFromJzodSchema.js';

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  "4_miroir-core_RestTools": {level:defaultLevels.INFO, },
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined},
}

import log from 'loglevelnext';
import { readFileSync } from 'fs';
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

// DEFUNCT (?)
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-filesystem.json', import.meta.url)).toString());
// import configFileContents from "../config/miroirConfig.server-indexedDb.json";


// const configFileContents = JSON.parse(fs.readFileSync(new URL('../config/miroirConfig.server-indexedDb.json')).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-mixed_filesystem-sql.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-sql.json', import.meta.url)).toString());
const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-filesystem-new.json', import.meta.url)).toString());


const miroirConfig:MiroirConfigServer = configFileContents as MiroirConfigServer;
myLogger.info('miroirConfig',miroirConfig)

const portFromConfig: number = Number(miroirConfig.server.rootApiUrl.substring(miroirConfig.server.rootApiUrl.lastIndexOf(":") + 1));


const app = express();
app.use(express.json());
myLogger.info(`Server being set-up, going to execute on the port::${portFromConfig}`);

// placeholder for the data
const users = [];



miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();


const storeControllerManager = new StoreControllerManager(ConfigurationService.StoreSectionFactoryRegister)
// await storeControllerManager.addStoreController(
//   "xxx",
//   miroirConfig.server.miroirAdminConfig
// );

// const localAdminStoreController = storeControllerManager.getStoreController("xxx");

// myLogger.info("found entity uuids:", await localAdminStoreController?.getEntityUuids());

// ##############################################################################################
// CREATING ENDPOINTS SERVICING CRUD HANDLERS
for (const op of restServerDefaultHandlers) {
  (app as any)[op.method](op.url, async (request:Request<{}, any, any, any, Record<string, any>>, response:any, context:any) => {
    const body = request.body;
    
    const result = await op.handler(
      (response: any) => response.json.bind(response),
      storeControllerManager,
      op.method,
      response, 
      request.originalUrl, 
      body, 
      request.params
    );
    return result;
  });
}

// ##############################################################################################
app.get('/', (req,res) => {
  res.send('App Works !!!!');
});
    
// ##############################################################################################
app.listen(portFromConfig, () => {
    myLogger.info(`Server listening on the port::${portFromConfig}`);
});