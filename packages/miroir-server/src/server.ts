import express from 'express';

import bodyParser from 'body-parser';
import { readFileSync } from 'fs';
import {
  ConfigurationService,
  IStoreController,
  MiroirConfig,
  StoreControllerFactory,
  defaultMiroirMetaModel,
  getHandler,
  miroirCoreStartup,
  modelActionRunner,
  postPutDeleteHandler
} from "miroir-core";
// import { SqlStoreFactory } from 'miroir-store-postgres';
// import { FileSystemEntityDataStore } from './FileSystemModelStore.js';
import { miroirStoreFileSystemStartup } from 'miroir-store-filesystem';
import { miroirStoreIndexedDbStartup } from 'miroir-store-indexedDb';
import { miroirStorePostgresStartup } from 'miroir-store-postgres';
import { generateZodSchemaFileFromJzodSchema } from './utils.js';

// const applicationDeploymentLibrary =await import("./assets/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json", {assert: { type: "json" }});
// TODO: find a better solution!
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed_filesystem-sql.json";

const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-filesystem.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-mixed_filesystem-sql.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-sql.json', import.meta.url)).toString());
console.log('configFileContents',configFileContents)

const applicationDeploymentLibrary = JSON.parse(readFileSync(new URL('./assets/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json', import.meta.url)).toString());
console.log('applicationDeploymentLibrary',applicationDeploymentLibrary)

const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

// miroirAppStartup();
miroirCoreStartup();
miroirStoreFileSystemStartup();
miroirStoreIndexedDbStartup();
miroirStorePostgresStartup();


const app = express(),
      port = 3080;

// placeholder for the data
const users = [];


console.log(`Server being set-up, going to execute on the port::${port}`);

let
  localMiroirStoreController:IStoreController,
  localAppStoreController:IStoreController
;

const {
  localMiroirStoreController:a,localAppStoreController:b
} = await StoreControllerFactory(
  ConfigurationService.storeFactoryRegister,
  miroirConfig,
);
localMiroirStoreController = a;
localAppStoreController = b;

try {
  await localMiroirStoreController.bootFromPersistedState(defaultMiroirMetaModel.entities, defaultMiroirMetaModel.entityDefinitions);
} catch(e) {
  console.error("failed to initialize meta-model, Entity 'Entity' is likely missing from Database. It can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",localMiroirStoreController.getEntityUuids(),'error',e);
}

try {
  await localAppStoreController.bootFromPersistedState(defaultMiroirMetaModel.entities, defaultMiroirMetaModel.entityDefinitions);
} catch(e) {
  console.error("failed to initialize app, Entity 'Entity' is likely missing from Database. It can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",localMiroirStoreController.getEntityUuids(),'error',e);
}

// ################################################################################################
await generateZodSchemaFileFromJzodSchema();
// ################################################################################################

app.use(bodyParser.json({limit:'10mb'}));


let count: number = 0;
// ##############################################################################################
app.get("/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all", async (req, res, ctx) => {
  // TODO: remove, it is identical to post!!
  const body = await req.body;
  console.log('get "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all" called, count',count++,'body',body);

  console.log('get /miroirWithDeployment/:deploymentUuid/entity/:parentUuid/all received req.originalUrl',req.originalUrl)
  await getHandler(
    "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
    localMiroirStoreController,
    localAppStoreController,
    req,
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
