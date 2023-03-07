import express from 'express';


import { DataTypes, Sequelize, ModelStatic, Model } from 'sequelize';

import bodyParser from 'body-parser';
import {
  DataStoreInterface,
  entityEntity,
  entityReport,
  IndexedDb,
  IndexedDbServer,
  Instance,
  reportEntityList,
  reportReportList,
} from "miroir-core";
import { sqlDbServer } from './sqlDbServer.js';

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

const sqlDataStore:DataStoreInterface = new sqlDbServer(sequelize);

await sequelize.sync({ force: true });

// await sqlDataStore.upsertInstance('Entity',entityEntity as Instance);
// await sqlDataStore.upsertInstance('Entity',entityReport as Instance);
// await sqlDataStore.upsertInstance('Report', reportEntityList as Instance);
// await sqlDataStore.upsertInstance('Report', reportReportList as Instance);


const localIndexedDbDataStore:DataStoreInterface = new IndexedDbServer(localIndexedDb);


app.use(bodyParser.json());

app.get("/miroir/" + ":entityName/all", async (req, res, ctx) => {
  const entityName: string =
    typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
  console.log("get", entityName + "/all started get #####################################");
  // const localData = await localIndexedDbDataStore.getInstances(entityName);
  const localData = await sqlDataStore.getInstances(entityName);
  console.log("server " + entityName + "/all", localData);
  return res.json(localData);
});

app.post("/miroir/" + ":entityName", async (req, res, ctx) => {
  const entityName: string =
    typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
  console.log("post", entityName + " started post #####################################");

  const addedObjects: any[] = await req.body;
  // const localData = await this.localIndexedDb.putValue(entityName, addedObjects[0]);
  for (const instance of addedObjects) {
    // await indexedDbUpsertInstance(localIndexedDb, entityName, instance);
    // await localIndexedDbDataStore.upsertInstance(entityName, instance);
    await sqlDataStore.upsertInstance(entityName, instance);

    console.log("server " + entityName + "put first object of", addedObjects);
  }
  return res.json(addedObjects);
});

app.put("/miroir/" + ":entityName", async (req, res, ctx) => {
  const entityName: string =
    typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
  console.log("post", entityName + " started put #####################################");

  const addedObjects: any[] = await req.body;

  // const localData = await localIndexedDbDataStore.upsertInstance(entityName, addedObjects[0]);
  const localData = await sqlDataStore.upsertInstance(entityName, addedObjects[0]);
  console.log("server " + entityName + "put first object of", addedObjects);
  return res.json(addedObjects[0]);
});

app.get('/api/users', (req, res) => {
  console.log('api/users called!!!!')
  res.json(users);
});

app.post('/api/user', (req, res) => {
  const user = req.body.user;
  console.log('Adding user::::::::', user);
  users.push(user);
  res.json("user addedd");
});

app.get('/', (req,res) => {
    res.send('App Works !!!!');
});

app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});