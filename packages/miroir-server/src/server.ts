import log from 'loglevelnext';
// import * as loglevel from 'loglevel';

// import * as pkg from 'loglevel-plugin-prefix';
import express from 'express';
import { readFileSync } from 'fs';
// import * as prettier from "prettier";

import {
  JzodObject
} from "@miroir-framework/jzod-ts";


import bodyParser from 'body-parser';
import {
  HttpMethod,
  LoggerFactoryInterface,
  MiroirConfig,
  MiroirLoggerFactory,
  SpecificLoggerOptionsMap,
  defaultLevels,
  entityDefinitionReport,
  restMethodGetHandler,
  restMethodModelActionRunnerHandler,
  restMethodsPostPutDeleteHandler
} from "miroir-core";
import { generateZodSchemaFileFromJzodSchema } from './generateZodSchemaFileFromJzodSchema.js';
import { startServer } from './start.js';



// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-filesystem.json', import.meta.url)).toString());
const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-indexedDb.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-mixed_filesystem-sql.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-sql.json', import.meta.url)).toString());
console.log('configFileContents',configFileContents)

const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

console.log("server starting log:", log);

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined}
}

MiroirLoggerFactory.setEffectiveLogger(
  log as any as LoggerFactoryInterface,
  defaultLevels.INFO,
  "[{{time}}] {{level}} ({{name}}) AAAA-",
  specificLoggerOptions,
);


const app = express(),
      port = 3080;

// placeholder for the data
const users = [];


console.log(`Server being set-up, going to execute on the port::${port}`);

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
  console.log("GENERATED!!!!!!!");
  
} catch (error) {
  console.error("could not generate TS files from Jzod schemas", error);
  
}

// ################################################################################################

app.use(bodyParser.json({limit:'10mb'}));

const crudHandlers: {
  operation: HttpMethod;
  url: string;
  handler: (response: any, effectiveUrl: string, requestBody: any, requestParams: any) => Promise<void>;
}[] = [
  {
    operation: "get",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
    handler: restMethodGetHandler.bind(
      restMethodGetHandler,
      (response: any) => response.json.bind(response),
      localMiroirStoreController,
      localAppStoreController,
      "get"
    ),
  },
  {
    operation: "put",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler.bind(
      restMethodsPostPutDeleteHandler,
      (response: any) => response.json.bind(response),
      localMiroirStoreController,
      localAppStoreController,
      "put"
    ),
  },
  {
    operation: "post",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler.bind(
      restMethodsPostPutDeleteHandler,
      (response: any) => response.json.bind(response),
      localMiroirStoreController,
      localAppStoreController,
      "post"
    ),
  },
  {
    operation: "delete",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler.bind(
      restMethodsPostPutDeleteHandler,
      (response: any) => response.json.bind(response),
      localMiroirStoreController,
      localAppStoreController,
      "delete"
    ),
  },
  {
    operation: "post",
    url: "/modelWithDeployment/:deploymentUuid/:actionName",
    handler: restMethodModelActionRunnerHandler.bind(
      restMethodModelActionRunnerHandler,
      (response: any) => response.json.bind(response),
      localMiroirStoreController,
      localAppStoreController,
      "post"
    ),
  },
];

// ##############################################################################################
// CREATING ENDPOINTS SERVICING CRUD HANDLERS
for (const op of crudHandlers) {
  (app as any)[op.operation](op.url, async (request:any, response:any, context:any) => {
    const body = await request.body;

    await op.handler(response, request.originalUrl, body, request.params);
  });
}

// ##############################################################################################
app.get('/', (req,res) => {
    res.send('App Works !!!!');
});

// ##############################################################################################
app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});
