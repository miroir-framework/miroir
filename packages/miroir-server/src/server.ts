import express, { Express, Request, Response } from 'express';

import bodyParser from 'body-parser'
import { entityEntity, entityReport, getInstances, IndexedDb, reportEntityList, reportReportList, upsertInstance } from 'miroir-core';

// const express = require('express');
const app = express(),
      port = 3080;

// place holder for the data
const users = [];

const localIndexedDb: IndexedDb = new IndexedDb("miroir")


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

app.use(bodyParser.json());

app.get("/miroir/" + ":entityName/all", async (req, res, ctx) => {
  const entityName: string =
    typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
  console.log("get", entityName + "/all started get #####################################");
  // const localData = await this.localIndexedDb.getAllValue(entityName);
  const localData = await getInstances(localIndexedDb, entityName);
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
    await upsertInstance(localIndexedDb, entityName, instance);

    console.log("server " + entityName + "put first object of", addedObjects);
  }
  return res.json(addedObjects);
});

app.put("/miroir/" + ":entityName", async (req, res, ctx) => {
  const entityName: string =
    typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
  console.log("post", entityName + " started put #####################################");

  const addedObjects: any[] = await req.body;

  // prepare localIndexedDb, in the case we receive a new Entity
  // if (entityName == "Entity") {
  //   localIndexedDb.addSubLevels([entityName]);
  // }

  // const localData = await this.localIndexedDb.putValue(entityName, addedObjects[0]);
  const localData = await upsertInstance(localIndexedDb, entityName, addedObjects[0]);
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