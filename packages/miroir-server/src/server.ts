import express from 'express';
import { z } from "zod";

import bodyParser from 'body-parser';
import {
  DataStoreInterface,
  DataflowConfiguration,
  generateHandlerBody,
  modelActionRunner
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

const deploymentConfig: z.infer<typeof DataflowConfiguration> = {
  type:'singleNode',
  model: {
    location: {
      type: 'filesystem',
      side:'server',
      directory:'C:/Users/nono/Documents/devhome/miroir-app/packages/miroir-core/src/assets'
    }
  },
  data: {
    location: {
      type: 'filesystem',
      side:'server',
      directory:'C:/Users/nono/Documents/devhome/miroir-app/packages/miroir-standalone-app/src/assets'
    }
  }
}

const sqlDbServerProxy:DataStoreInterface = await createSqlServerProxy('postgres://postgres:postgres@localhost:5432/postgres');
const fileSystemServerProxy:DataStoreInterface = new FileSystemEntityDataStore(deploymentConfig.model.location['directory'],deploymentConfig.data.location['directory']);

try {
  await sqlDbServerProxy.start();
} catch(e) {
  console.error("failed to initialize server, Entity 'Entity' is likely missing from Database. It can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",sqlDbServerProxy.getEntities(),'error',e);
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
    sqlDbServerProxy.getInstances.bind(sqlDbServerProxy),
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
    sqlDbServerProxy.upsertInstance.bind(sqlDbServerProxy),
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
    sqlDbServerProxy.upsertInstance.bind(sqlDbServerProxy),
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
    actionName,
    sqlDbServerProxy,
    update
  );
 
  return res.json([]);
});

// ##############################################################################################
app.get('/api/users', (req, res) => {
  console.log('api/users called!!!!')
  res.json(users);
});

// ##############################################################################################
app.post('/api/user', (req, res) => {
  const user = req.body.user;
  console.log('Adding user::::::::', user);
  users.push(user);
  res.json("user addedd");
});

// ##############################################################################################
app.get('/', (req,res) => {
    res.send('App Works !!!!');
});

// ##############################################################################################
app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});
