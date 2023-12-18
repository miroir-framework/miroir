// import bodyParser from 'body-parser';
import express, { Request } from 'express';

import {
  ConfigurationService,
  LoggerFactoryInterface,
  LoggerInterface,
  MiroirConfig,
  MiroirLoggerFactory,
  SpecificLoggerOptionsMap,
  StoreControllerManager,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  createStoreControllers,
  defaultLevels,
  getLoggerName,
  miroirCoreStartup,
  restServerDefaultHandlers,
  startLocalStoreControllers
} from "miroir-core";

import { cleanLevel, packageName } from "./constants";

// import { generateZodSchemaFileFromJzodSchema } from './generateZodSchemaFileFromJzodSchema.js';

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined}
}

import log from 'loglevelnext';
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


// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-filesystem.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(fs.readFileSync(new URL('../config/miroirConfig.server-indexedDb.json')).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-mixed_filesystem-sql.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-sql.json', import.meta.url)).toString());

import { miroirStoreFileSystemStartup } from 'miroir-store-filesystem';
import { miroirStoreIndexedDbStartup } from 'miroir-store-indexedDb';
import { miroirStorePostgresStartup } from 'miroir-store-postgres';
import configFileContents from "../config/miroirConfig.server-indexedDb.json";
// myLogger.info('configFileContents',configFileContents)

const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

myLogger.info("server starting log:", myLogger);

const app = express(),
      port = 3080;
app.use(express.json());

// placeholder for the data
const users = [];


myLogger.info(`Server being set-up, going to execute on the port::${port}`);

const storeControllerManager = new StoreControllerManager(ConfigurationService.storeFactoryRegister)

miroirCoreStartup();
miroirStoreFileSystemStartup();
miroirStoreIndexedDbStartup();
miroirStorePostgresStartup();


if (miroirConfig.emulateServer) { // _TODO: spurious test, the MiroirConfig type must be corrected.
      // ##############################################################################################
      // CREATING ENDPOINTS SERVICING CRUD HANDLERS
      for (const op of restServerDefaultHandlers) {
        (app as any)[op.method](op.url, async (request:Request<{}, any, any, any, Record<string, any>>, response:any, context:any) => {
          const body = request.body;
          
          // console.log("received", op.method, op.url, "body", body)
          // console.log("received", op.method, op.url, "request", request)

          const result = await op.handler(
            (response: any) => response.json.bind(response),
            storeControllerManager,
            miroirConfig,
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
      app.listen(port, () => {
          myLogger.info(`Server listening on the port::${port}`);
      });
} else {
  throw new Error("Configuration has emulateServer = false");
  // exit(1);
}