import express from 'express';
import { readFileSync } from 'fs';
// import * as prettier from "prettier";

import {
  JzodObject
} from "@miroir-framework/jzod-ts";


import bodyParser from 'body-parser';
import {
  MiroirConfig,
  entityDefinitionReport,
  modelActionRunner,
} from "miroir-core";
import { generateZodSchemaFileFromJzodSchema } from './generateZodSchemaFileFromJzodSchema.js';
import { startServer } from './start.js';
import { handleRestServiceCallAndGenerateServiceResponse, postPutDeleteHandler } from 'miroir-server-msw-stub';



const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-filesystem.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-indexedDb.json', import.meta.url)).toString());
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


let count: number = 0;
// ##############################################################################################
app.get("/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all", async (req, res, ctx) => {
  // TODO: remove, it is identical to post!!
  const body = await req.body;
  console.log('get "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all" called, count',count++,'body',body);

  console.log('get /miroirWithDeployment/:deploymentUuid/entity/:parentUuid/all received req.originalUrl',req.originalUrl)
  await handleRestServiceCallAndGenerateServiceResponse(
    "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
    localMiroirStoreController,
    localAppStoreController,
    req,
    undefined,
    res.json.bind(res)
  )
});

// ##############################################################################################
app.put("/miroirWithDeployment/:deploymentUuid/:section/entity", async (req, res, ctx) => {
  // TODO: remove, it is identical to post!!
  const body = await req.body;

  console.log('put /miroirWithDeployment/entity received count',count++,'body',body);
  console.log('put /miroirWithDeployment/entity received req.originalUrl',req.originalUrl)

  await postPutDeleteHandler(
    "/miroirWithDeployment/:deploymentUuid/:section/entity",
    'put',
    body,
    localMiroirStoreController,
    localAppStoreController,
    req,
    undefined,
    res.json.bind(res)
  )
});

// ##############################################################################################
app.post("/miroirWithDeployment/:deploymentUuid/:section/entity", async (req, res, ctx) => {
  // TODO: remove, it is identical to post!!
  const body = await req.body;

  console.log('post /miroirWithDeployment/:deploymentUuid/:section/entity received count',count++,'body',body);
  console.log('post /miroirWithDeployment/:deploymentUuid/:section/entity received req.originalUrl',req.originalUrl)

  await postPutDeleteHandler(
    "/miroirWithDeployment/:deploymentUuid/:section/entity",
    'post',
    body,
    localMiroirStoreController,
    localAppStoreController,
    req,
    undefined,
    res.json.bind(res)
  )
});

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
    deploymentUuid,
    actionName,
    localMiroirStoreController,
    localAppStoreController,
    update
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
