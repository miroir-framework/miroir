import bodyParser from 'body-parser';
import express from 'express';
import { readFileSync } from 'fs';
// import ViteExpress from "vite-express";

import {
  JzodObject,
  JzodElement,
} from "@miroir-framework/jzod-ts";

import { zodToJzod } from "@miroir-framework/jzod";



import {
  DomainActionSchema,
  EntityInstanceCollectionSchema,
  LoggerFactoryInterface,
  LoggerInterface,
  MiroirConfig,
  MiroirLoggerFactory,
  SpecificLoggerOptionsMap,
  defaultLevels,
  entityDefinitionReport,
  getLoggerName,
  miroirFundamentalJzodSchema,
  restServerDefaultHandlers
} from "miroir-core";
// import { loglevelnext } from './loglevelnextImporter';
import { cleanLevel, packageName } from './constants.js';
import { generateZodSchemaFileFromJzodSchema } from './generateZodSchemaFileFromJzodSchema.js';
import { startServer } from './start.js';

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
  "[{{time}}] {{level}} ({{name}}) AAAA-",
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
const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-indexedDb.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-mixed_filesystem-sql.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-sql.json', import.meta.url)).toString());
myLogger.info('configFileContents',configFileContents)

const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

myLogger.info("server starting log:", myLogger);

const app = express(),
      port = 3080;

// placeholder for the data
const users = [];


myLogger.info(`Server being set-up, going to execute on the port::${port}`);

const convertedZodSchema = zodToJzod(EntityInstanceCollectionSchema,"EntityInstanceCollectionSchema");
console.log("####### convertedZodSchema",JSON.stringify(convertedZodSchema, null, 2));

const {
  localMiroirStoreController,
  localAppStoreController
} = await startServer(miroirConfig);


// ################################################################################################
const jzodSchemaConversion: {
  jzodElement: JzodElement,
  targetFileName: string,
  jzodSchemaVariableName:string,
}[] = [
  // {
  //   jzodObject: entityDefinitionReport.jzodSchema as any as JzodObject,
  //   targetFileName: "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/server-generated.ts",
  //   jzodSchemaVariableName: "report",
  // },
  {
    jzodElement: miroirFundamentalJzodSchema.definition as any as JzodElement,
    targetFileName: "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
    jzodSchemaVariableName: "miroirFundamentalType",
  },
  // {
  //   jzodObject: miroirJzodSchemaBootstrap.definition as any as JzodObject,
  //   targetFileName: "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/jzodSchema.ts",
  //   jzodSchemaVariableName: "jzodSchema",
  // }
];

try {
  for (const schema of jzodSchemaConversion) {
    await generateZodSchemaFileFromJzodSchema(schema.jzodElement,schema.targetFileName,schema.jzodSchemaVariableName)
  }
  myLogger.info("GENERATED!!!!!!!");
  
} catch (error) {
  myLogger.error("could not generate TS files from Jzod schemas", error);
  
}

// ################################################################################################
app.use(bodyParser.json({limit:'10mb'}));

// ##############################################################################################
// CREATING ENDPOINTS SERVICING CRUD HANDLERS
for (const op of restServerDefaultHandlers) {
  (app as any)[op.method](op.url, async (request:any, response:any, context:any) => {
    const body = await request.body;

    await op.handler(
      (response: any) => response.json.bind(response),
      localMiroirStoreController,
      localAppStoreController,
      op.method,
      response, 
      request.originalUrl, 
      body, 
      request.params);
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
// ViteExpress.listen(app, port, () => {
//     myLogger.info(`Server listening on the port::${port}`);
// });
