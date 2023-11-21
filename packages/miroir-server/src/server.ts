import express from 'express';
import { readFileSync } from 'fs';
import bodyParser from 'body-parser';
import ViteExpress from "vite-express";

import {
  JzodObject
} from "@miroir-framework/jzod-ts";


import {
  HttpMethod,
  LoggerFactoryInterface,
  LoggerInterface,
  MiroirConfig,
  MiroirLoggerFactory,
  RestMethodHandler,
  SpecificLoggerOptionsMap,
  defaultLevels,
  entityDefinitionReport,
  getLoggerName,
  restMethodGetHandler,
  restMethodModelActionRunnerHandler,
  restMethodsPostPutDeleteHandler
} from "miroir-core";
// import { loglevelnext } from './loglevelnextImporter';
import { generateZodSchemaFileFromJzodSchema } from './generateZodSchemaFileFromJzodSchema';
import { startServer } from './start';
import { cleanLevel, packageName } from './constants';

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

const {
  localMiroirStoreController,
  localAppStoreController
} = await startServer(miroirConfig);


// ################################################################################################
const jzodSchemaConversion: {
  jzodObject: JzodObject,
  targetFileName: string,
  jzodSchemaVariableName:string,
}[] = [
  {
    jzodObject: entityDefinitionReport.jzodSchema as any as JzodObject,
    targetFileName: "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/server-generated.ts",
    jzodSchemaVariableName: "report",
  },
  // {
  //   jzodObject: miroirJzodSchemaBootstrap.definition as any as JzodObject,
  //   targetFileName: "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/jzodSchema.ts",
  //   jzodSchemaVariableName: "jzodSchema",
  // }
];

try {
  for (const schema of jzodSchemaConversion) {
    await generateZodSchemaFileFromJzodSchema(schema.jzodObject,schema.targetFileName,schema.jzodSchemaVariableName)
  }
  myLogger.info("GENERATED!!!!!!!");
  
} catch (error) {
  myLogger.error("could not generate TS files from Jzod schemas", error);
  
}

// ################################################################################################

app.use(bodyParser.json({limit:'10mb'}));

const crudHandlers: {
  method: HttpMethod,
  url: string,
  handler: RestMethodHandler,
}[] = [
  {
    method: "get",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
    handler: restMethodGetHandler
  },
  {
    method: "put",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "post",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "delete",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "post",
    url: "/modelWithDeployment/:deploymentUuid/:actionName",
    handler: restMethodModelActionRunnerHandler
  },
];

// ##############################################################################################
// CREATING ENDPOINTS SERVICING CRUD HANDLERS
for (const op of crudHandlers) {
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
// app.listen(port, () => {
//     myLogger.info(`Server listening on the port::${port}`);
// });
ViteExpress.listen(app, port, () => {
    myLogger.info(`Server listening on the port::${port}`);
});
