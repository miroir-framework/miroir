import express from 'express';


import { DataTypes, Sequelize, ModelStatic, Model } from 'sequelize';

import bodyParser from 'body-parser';
import {
  DataStoreInterface,
  entityEntity,
  entityReport,
  IndexedDb,
  IndexedDbServer,
  ModelStructureUpdate,
  reportEntityList,
  reportReportList,
} from "miroir-core";
import { SqlDbServer } from './sqlDbServer.js';

// const express = require('express');
const app = express(),
      port = 3080;

// place holder for the data
const users = [];

const localIndexedDb: IndexedDb = new IndexedDb("miroir-indexedDb")


await localIndexedDb.createObjectStore(["Entity", "Instance", "Report", "Author", "Book"]);
await localIndexedDb.clearObjectStore();
await localIndexedDb.putValue("Entity", entityEntity);
await localIndexedDb.putValue("Entity", entityReport);
await localIndexedDb.putValue("Report", reportEntityList);
await localIndexedDb.putValue("Report", reportReportList);
// await localIndexedDb.putValue("Entity", entityAuthor);
// await localIndexedDb.putValue("Entity", entityBook);
// await localIndexedDb.putValue("Report", reportBookList);
// await localIndexedDb.putValue("Author", author1);
// await localIndexedDb.putValue("Author", author2);
// await localIndexedDb.putValue("Author", author3);
// await localIndexedDb.putValue("Book", book1);
// await localIndexedDb.putValue("Book", book2);
// await localIndexedDb.putValue("Book", book3);
// await localIndexedDb.putValue("Book", book4);

console.log(`Server being set-up, going to execute on the port::${port}`);

const sequelize:Sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/postgres',{logging: (...msg) => console.log(msg)}) // Example for postgres
try {
  await sequelize.authenticate();
  console.log('Connection to postgres has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the postgres database:', error);
}

const sqlDbServer:DataStoreInterface = new SqlDbServer(sequelize);

try {
  await sqlDbServer.init();
} catch(e) {
  console.error("failed to initialize server, Entity 'Entity' is likely missing from Database. It can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",sqlDbServer.getEntities());
}

// await sequelize.sync({ force: true });

// await sqlDataStore.upsertInstance('Entity',entityEntity as Instance);
// await sqlDataStore.upsertInstance('Entity',entityReport as Instance);
// await sqlDataStore.upsertInstance('Report', reportEntityList as Instance);
// await sqlDataStore.upsertInstance('Report', reportReportList as Instance);


const localIndexedDbDataStore:DataStoreInterface = new IndexedDbServer(localIndexedDb);


app.use(bodyParser.json());

// ##############################################################################################
app.get("/miroir/" + ":entityName/all", async (req, res, ctx) => {
  const entityName: string =
    typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
  console.log("get", entityName + "/all started #####################################");
  // const localData = await localIndexedDbDataStore.getInstances(entityName);
  const localData = await sqlDbServer.getInstances(entityName);
  console.log("server " + entityName + "/all", localData);
  return res.json(localData);
});

// ##############################################################################################
app.post("/miroir/" + ":entityName", async (req, res, ctx) => {
  const entityName: string =
    typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
  console.log("post /miroir/", entityName + " started #####################################");

  const addedObjects: any[] = await req.body;
  // const localData = await this.localIndexedDb.putValue(entityName, addedObjects[0]);
  for (const instance of addedObjects) {
    await sqlDbServer.upsertInstance(entityName, instance);

    console.log("server " + entityName + "put object", instance);
  }
  return res.json(addedObjects);
});

// ##############################################################################################
app.put("/miroir/" + ":entityName", async (req, res, ctx) => {
  const entityName: string =
    typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
  console.log("put miroir/", entityName + " started #####################################");

  const addedObjects: any[] = await req.body;

  // const localData = await localIndexedDbDataStore.upsertInstance(entityName, addedObjects[0]);
  for (const instance of addedObjects) {
    await sqlDbServer.upsertInstance(entityName, instance);

    console.log("server " + entityName + "put object", instance);
  }
  // console.log("server " + entityName + "put object of", addedObjects);
  return res.json(addedObjects);
});

// ##############################################################################################
app.post("/model/" + ':actionName', async (req, res, ctx) => {
  const actionName: string =
    typeof req.params["actionName"] == "string" ? req.params["actionName"] : req.params["actionName"][0];
  
  // const updates: RemoteStoreModelAction[] = await req.body;
  const updates: ModelStructureUpdate[] = await req.body;
  console.log("post model/"," started #####################################");
  console.log("post model/ updates",updates);

  // const localData = await localIndexedDbDataStore.upsertInstance(entityName, addedObjects[0]);
  // for (const instance of addedObjects) {
  switch (actionName) {
    case 'resetModel':{
      console.log('resetModel before drop sequelize.models', Object.keys(sequelize.models));
      await sequelize.drop();
      // await sequelize.sync();
      console.log('resetModel after drop sequelize.models', Object.keys(sequelize.models), 'sqlDbServer entities',sqlDbServer.getEntities());
      sqlDbServer.dropEntities(Object.keys(sequelize.models));
      console.log('resetModel after dropEntity', Object.keys(sequelize.models), 'sqlDbServer entities',sqlDbServer.getEntities());

      break;
    }
    case 'updateModel': {
      if (updates[0]) {
        switch (updates[0]['action']) {
          // case '':
          //   break;
          default:
            sqlDbServer.applyModelStructureUpdates(updates);
            console.log('post model ignore updates', updates);
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
 
  //   console.log("server " + entityName + "put object", instance);
  // }
  // console.log("server " + entityName + "put object of", addedObjects);
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