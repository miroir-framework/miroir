import express from 'express';
import { z } from "zod";

import bodyParser from 'body-parser';
import {
  DataStoreInterface,
  ApplicationDeployment,
  generateHandlerBody,
  modelActionRunner,
  applicationDeploymentMiroir,
  applicationDeploymentLibrary,
  defaultMiroirMetaModel
} from "miroir-core";
import { createSqlServerProxy } from 'miroir-datastore-postgres';
import { FileSystemEntityDataStore } from './FileSystemEntityDataStore.js';

// const express = require('express');
const app = express(),
      port = 3080;

// placeholder for the data
const users = [];

// const localUuidIndexedDb: IndexedDb = new IndexedDb("miroir-uuid-indexedDb")
// const localIndexedDbDataStore:DataStoreInterface = new IndexedDbDataStore(localUuidIndexedDb);

console.log(`Server being set-up, going to execute on the port::${port}`);


// const sqlDbServerProxy:DataStoreInterface = await createSqlServerProxy('postgres://postgres:postgres@localhost:5432/postgres');
const miroirAppSqlServerProxy:DataStoreInterface = await createSqlServerProxy(
  'miroir',
  'miroir',
  applicationDeploymentMiroir.model.location['connectionString'],
  applicationDeploymentMiroir.model.location['schema'],
  applicationDeploymentMiroir.data.location['connectionString'],
  applicationDeploymentMiroir.data.location['schema'],
);
const libraryAppSqlServerProxy:DataStoreInterface = await createSqlServerProxy(
  'library',
  'app',
  applicationDeploymentLibrary.model.location['connectionString'],
  applicationDeploymentLibrary.model.location['schema'],
  applicationDeploymentLibrary.data.location['connectionString'],
  applicationDeploymentLibrary.data.location['schema'],
);
// const fileSystemServerProxy:DataStoreInterface = new FileSystemEntityDataStore(applicationDeploymentConfigMiroir.model.location['directory'],applicationDeploymentConfigMiroir.data.location['directory']);

try {
  await miroirAppSqlServerProxy.createProxy(defaultMiroirMetaModel,'miroir');
} catch(e) {
  console.error("failed to initialize meta-model, Entity 'Entity' is likely missing from Database. It can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",miroirAppSqlServerProxy.getEntities(),'error',e);
}

try {
  await libraryAppSqlServerProxy.createProxy(defaultMiroirMetaModel,'app');
} catch(e) {
  console.error("failed to initialize app, Entity 'Entity' is likely missing from Database. It can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",miroirAppSqlServerProxy.getEntities(),'error',e);
}

app.use(bodyParser.json());


// ##############################################################################################
app.get("/miroir/entity/" + ":parentUuid/all", async (req, res, ctx) => {
  return generateHandlerBody(
    req.params,
    ['parentUuid'],
    [],
    'get',
    "/miroir/entity/",
    miroirAppSqlServerProxy.getInstances.bind(miroirAppSqlServerProxy),
    res.json.bind(res)
  )
});

// ##############################################################################################
app.get("/miroirWithDeployment/:deploymentUuid/entity/:parentUuid/all", async (req, res, ctx) => {
  // TODO: remove, it is identical to post!!
  const body = await req.body;
  console.log('get /miroirWithDeployment/:deploymentUuid/entity/:parentUuid/all received, count',count++,'body',body);
  console.log('get /miroirWithDeployment/:deploymentUuid/entity/:parentUuid/all received req.originalUrl',req.originalUrl)
  
  const deploymentUuid: string =
    typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];
  
  const parentUuid: string =
    typeof req.params["parentUuid"] == "string" ? req.params["parentUuid"] : req.params["parentUuid"][0];
  
  const targetProxy = deploymentUuid == applicationDeploymentLibrary.uuid?libraryAppSqlServerProxy:miroirAppSqlServerProxy;
  console.log("server get miroirWithDeployment/ using application",targetProxy['applicationName'], "deployment",deploymentUuid,'applicationDeploymentLibrary.uuid',applicationDeploymentLibrary.uuid);

  return generateHandlerBody(
    {parentUuid},
    ['parentUuid'],
    body,
    'get',
    "/miroirWithDeployment/entity/",
    targetProxy.getInstances.bind(targetProxy),
    res.json.bind(res)
  )
});


// ##############################################################################################
app.put("/miroir/entity", async (req, res, ctx) => {
  return generateHandlerBody(
    req.params,
    [],
    await req.body,
    'put',
    "/miroir/entity/",
    miroirAppSqlServerProxy.upsertDataInstance.bind(miroirAppSqlServerProxy),
    res.json.bind(res)
  )
});

// ##############################################################################################
app.put("/miroirWithDeployment/:deploymentUuid/entity", async (req, res, ctx) => {
  // TODO: remove, it is identical to post!!
  const body = await req.body;
  console.log('put /miroirWithDeployment/entity received, count',count++,'body',body);
  console.log('put /miroirWithDeployment/entity received req.originalUrl',req.originalUrl)
  
  const deploymentUuid: string =
    typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];
  
  const targetProxy = deploymentUuid == applicationDeploymentLibrary.uuid?libraryAppSqlServerProxy:miroirAppSqlServerProxy;
  console.log("server put miroirWithDeployment/ using application",targetProxy['applicationName'], "deployment",deploymentUuid,'applicationDeploymentLibrary.uuid',applicationDeploymentLibrary.uuid);

  return generateHandlerBody(
    req.params,
    [],
    body,
    'put',
    "/miroirWithDeployment/entity/",
    targetProxy.upsertInstance.bind(targetProxy),
    res.json.bind(res)
  )
});

let count = 0
// ##############################################################################################
app.post("/miroir/entity", async (req, res, ctx) => {
  const body = await req.body;
  console.log('post /miroir/entity received, count',count++,'body',body);
  console.log('post /miroir/entity received req.originalUrl',req.originalUrl)

  return generateHandlerBody(
    req.params,
    [],
    body,
    'post',
    "/miroir/entity/",
    miroirAppSqlServerProxy.upsertDataInstance.bind(miroirAppSqlServerProxy),
    res.json.bind(res)
  )
});

// ##############################################################################################
app.post("/miroirWithDeployment/:deploymentUuid/entity", async (req, res, ctx) => {
  const body = await req.body;
  console.log('post /miroirWithDeployment/entity received, count',count++,'body',body);
  console.log('post /miroirWithDeployment/entity received req.originalUrl',req.originalUrl)
  
  const deploymentUuid: string =
    typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];
  
  const targetProxy = deploymentUuid == applicationDeploymentLibrary.uuid?libraryAppSqlServerProxy:miroirAppSqlServerProxy;
  console.log("server post miroirWithDeployment/ using application",targetProxy['applicationName'], "deployment",deploymentUuid,'applicationDeploymentLibrary.uuid',applicationDeploymentLibrary.uuid);

  return generateHandlerBody(
    req.params,
    [],
    body,
    'post',
    "/miroirWithDeployment/entity/",
    targetProxy.upsertInstance.bind(targetProxy),
    res.json.bind(res)
  )
});

// ##############################################################################################
app.post("/model/" + ':actionName', async (req, res, ctx) => {
  const actionName: string =
    typeof req.params["actionName"] == "string" ? req.params["actionName"] : req.params["actionName"][0];
  let update = [];
  try {
    update = await req.body;
  } catch(e){}

  // const updates: RemoteStoreModelAction[] = await req.body;
  console.log("server post model/"," started #####################################");
  await modelActionRunner(
    undefined,
    actionName,
    miroirAppSqlServerProxy,
    libraryAppSqlServerProxy,
    update
  );
 
  return res.json([]);
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
    miroirAppSqlServerProxy,
    libraryAppSqlServerProxy,
    update
  );
 
  return res.json([]);
});

// // ##############################################################################################
// app.get('/api/users', (req, res) => {
//   console.log('api/users called!!!!')
//   res.json(users);
// });

// // ##############################################################################################
// app.post('/api/user', (req, res) => {
//   const user = req.body.user;
//   console.log('Adding user::::::::', user);
//   users.push(user);
//   res.json("user addedd");
// });

// ##############################################################################################
app.get('/', (req,res) => {
    res.send('App Works !!!!');
});

// ##############################################################################################
app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});
