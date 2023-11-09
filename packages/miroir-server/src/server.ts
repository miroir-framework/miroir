import express from 'express';
import { readFileSync } from 'fs';
// import * as prettier from "prettier";

import {
  JzodObject
} from "@miroir-framework/jzod-ts";


import bodyParser from 'body-parser';
import {
  HttpMethod,
  MiroirConfig,
  entityDefinitionReport,
  modelActionRunner,
  restMethodGetHandler,
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

const handlers: {
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
];

for (const op of handlers) {
  (app as any)[op.operation](op.url, async (req:any, res:any, ctx:any) => {
    const body = await req.body;

    await op.handler(res, req.originalUrl, body, req.params);
  });
}

// ##############################################################################################
app.post("/modelWithDeployment" + '/:deploymentUuid' + '/:actionName', async (req, res, ctx) => {
  const actionName: string =
    typeof req.params["actionName"] == "string" ? req.params["actionName"] : req.params["actionName"][0];
  const deploymentUuid: string =
    typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];
  
  let update = [];
  try {
    update = await req.body;
  } catch(e){}

  // const updates: RemoteStoreModelAction[] = await req.body;
  console.log("server post modelWithDeployment/"," started #####################################");
  console.log("server post modelWithDeployment/ deploymentUuid",deploymentUuid,"actionName",actionName);
  // console.log("server post modelWithDeployment/ using",deploymentUuid == applicationDeploymentLibrary.uuid?"library":"miroir","schema");
  
  await modelActionRunner(
    localMiroirStoreController,
    localAppStoreController,
    deploymentUuid,
    actionName,
    update.modelUpdate
  );
 
  res.json([]);
});

// ##############################################################################################
app.get('/', (req,res) => {
    res.send('App Works !!!!');
});

// ##############################################################################################
app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});
