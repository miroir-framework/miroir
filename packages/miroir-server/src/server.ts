import express from 'express';

import bodyParser from 'body-parser';
import {
  DataStoreInterface,
  generateHandlerBody,
  ModelReplayableUpdate
} from "miroir-core";
import { createServer } from 'miroir-datastore-postgres';

// const express = require('express');
const app = express(),
      port = 3080;

// placeholder for the data
const users = [];

// const localUuidIndexedDb: IndexedDb = new IndexedDb("miroir-uuid-indexedDb")
// const localIndexedDbDataStore:DataStoreInterface = new IndexedDbDataStore(localUuidIndexedDb);

console.log(`Server being set-up, going to execute on the port::${port}`);

const sqlDbServer:DataStoreInterface = await createServer('postgres://postgres:postgres@localhost:5432/postgres');

try {
  await sqlDbServer.start();
} catch(e) {
  console.error("failed to initialize server, Entity 'Entity' is likely missing from Database. It can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",sqlDbServer.getEntityDefinitions(),'error',e);
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
    sqlDbServer.getInstances.bind(sqlDbServer),
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
    sqlDbServer.upsertInstance.bind(sqlDbServer),
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
    sqlDbServer.upsertInstance.bind(sqlDbServer),
    res.json.bind(res)
  )
});

// ##############################################################################################
app.post("/model/" + ':actionName', async (req, res, ctx) => {
  const actionName: string =
    typeof req.params["actionName"] == "string" ? req.params["actionName"] : req.params["actionName"][0];
  
  // const updates: RemoteStoreModelAction[] = await req.body;
  console.log("server post model/"," started #####################################");

  // const localData = await localIndexedDbDataStore.upsertInstance(parentName, addedObjects[0]);
  // for (const instance of addedObjects) {
  console.log('server post sqlDbServer.getEntities()', sqlDbServer.getEntityDefinitions());
  switch (actionName) {
    case 'resetModel':{
      // const update = (await req.body)[0];
      console.log("server post model/resetModel update");
      await sqlDbServer.dropModel();
      console.log('server post resetModel after dropped sqlDbServer entities:',sqlDbServer.getEntities(),'entityDefinitions:',sqlDbServer.getEntityDefinitions());
      // await sqlDbServer.initModel();
      // console.log('server post resetModel after initModel, entities:',sqlDbServer.getEntities(),'entityDefinitions:',sqlDbServer.getEntityDefinitions());
      break;
    }
    case 'initModel':{
      const update = (await req.body)[0];
      console.log("server post model/initModel update",update);
      await sqlDbServer.initModel();
      console.log('server post resetModel after initModel, entities:',sqlDbServer.getEntities(),'entityDefinitions:',sqlDbServer.getEntityDefinitions());
      break;
    }
    case 'updateEntity': {
      const update: ModelReplayableUpdate = (await req.body)[0];
      console.log("server post model/updateEntity update",update);
      if (update) {
        switch (update['action']) {
          default:
            await sqlDbServer.applyModelEntityUpdate(update);
            console.log('post applyModelEntityUpdate done', update);
            break;
        }
      } else {
        console.log('post model/ has no update to execute!')
      }
      break;
    }
    default:
      console.log('post model/ could not handle actionName', actionName)
      break;
  }
 
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
