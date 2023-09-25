import express from 'express';
import * as fs from "fs";
import { readFileSync } from 'fs';
// import * as prettier from "prettier";

import {
  JzodElement,
  JzodObject,
  jzodToTsCode,
  jzodToTsTypeAliasesAndZodText,
  printTsTypeAliases,
} from "@miroir-framework/jzod-ts";


import bodyParser from 'body-parser';
import {
  ConfigurationService,
  IStoreController,
  MiroirConfig,
  StoreControllerFactory,
  defaultMiroirMetaModel,
  entityDefinitionReport,
  getHandler,
  miroirCoreStartup,
  miroirJzodSchemaBootstrap,
  modelActionRunner,
  postPutDeleteHandler
} from "miroir-core";
// import { SqlStoreFactory } from 'miroir-store-postgres';
// import { FileSystemEntityDataStore } from './FileSystemModelStore.js';
import { miroirStoreFileSystemStartup } from 'miroir-store-filesystem';
import { miroirStoreIndexedDbStartup } from 'miroir-store-indexedDb';
import { miroirStorePostgresStartup } from 'miroir-store-postgres';
// import { generateZodSchemaFileFromJzodSchema } from './utils';

// // ################################################################################################
// export function jzodToTsCode (
//   jzodElement: JzodElement,
//   exportPrefix: boolean = true,
//   typeName?: string,
// ): string {
//   // console.log(
//   //   "getTsCodeCorrespondingToZodSchemaAndDescription jzodSchemaZodSchemaAndDescription.contextZodSchema",
//   //   "jzodElement",
//   //   JSON.stringify(jzodElement)
//   // );
  
//   const schemaName = typeName?typeName.replace(/^(.)(.*)$/, (a, b, c) => b.toLowerCase() + c):"";
//   // console.log("getTsCodeCorrespondingToZodSchemaAndDescription convertedJsonZodSchema", bodyJsCode);

//   const header = `import { ZodType, ZodTypeAny, z } from "zod";`;

//   const typeAliasesAndZodText = jzodToTsTypeAliasesAndZodText(jzodElement, typeName);

//   const bodyJsCode = `export const ${schemaName}: z.ZodType<${schemaName}> = ${typeAliasesAndZodText.mainZodText};`;

//   const contextTsTypesString = printTsTypeAliases(typeAliasesAndZodText.contextTsTypeAliases, exportPrefix);
//   // console.log("getTsCodeCorrespondingToZodSchemaAndDescription !!!!!! contextTsTypesString",contextTsTypesString);
//   console.log("getTsCodeCorrespondingToZodSchemaAndDescription !!!!!! bodyJsCode",bodyJsCode);

//   const contextJsCode = typeAliasesAndZodText.contextZodText
//     ? Object.entries(typeAliasesAndZodText.contextZodText).reduce((acc, curr) => {
//         return `${acc}
// export const ${curr[0]}: z.ZodType<${curr[0]}> =${curr[1]};`;
//       }, "")
//     : ""
//   ;

//   const tsTypesString = (exportPrefix?"export ":"") + printNode(typeAliasesAndZodText.mainTsTypeAlias);
//   // console.log("getTsCodeCorrespondingToZodSchemaAndDescription tsTypeString",tsTypesString);

//   return `${header}
// ${contextTsTypesString}
// ${tsTypesString}
// ${contextJsCode}
// ${bodyJsCode}
// `;
// }


export async function generateZodSchemaFileFromJzodSchema(
  jzodObject: JzodObject,
  targetFileName: string,
  jzodSchemaVariableName:string,
) {
  // console.log("generateZodSchemaFileFromJzodSchema called!");
  
  // console.log("generateZodSchemaFileFromJzodSchema miroirJzodSchemaBootstrap",JSON.stringify(miroirJzodSchemaBootstrap,null,2));
  // console.log("generateZodSchemaFileFromJzodSchema miroirJzodSchemaBootstrapZodSchema",JSON.stringify(miroirJzodSchemaBootstrapZodSchema,null,2));

//   const globalReferences = ()=>({
//     "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": jzodElementSchemaToZodSchemaAndDescription (

//       miroirJzodSchemaBootstrap.definition as JzodObject,
//       () => miroirJzodSchemaBootstrapZodSchema,
//     )
//   });
// // console.log("generateZodSchemaFileFromJzodSchema miroir entity definition TS type generation","globalReferences",globalReferences);

//   const jzodObjectZodSchema: ZodSchemaAndDescription = jzodElementSchemaToZodSchemaAndDescription (
//     // entityDefinitionReport.jzodSchema as any as JzodObject,
//     jzodObject,
//     miroirJzodSchemaBootstrapZodSchema,
//     globalReferences
//   );

  // console.log(
  //   "generateZodSchemaFileFromJzodSchema miroir entity definition TS type generation",
  //   "globalReferences 1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
  //   (globalReferences["1e8dab4b-65a3-4686-922e-ce89a2d62aa9"].zodSchema as AnyZodObject).shape
  // );
  // console.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport",entityDefinitionReport);
 
  // const generatedZodSchemasFile = "C://Users/nono/Documents/devhome/miroir-app/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/server-generated.ts";
  // const generatedZodSchemasFile = "C://Users/nono/Documents/devhome/miroir-app/packages/miroir-standalone-app/src/preprocessor-generated/server-generated.ts";
 
  const newFileContentsNotFormated = jzodToTsCode(jzodObject, true, jzodSchemaVariableName)
  // const newFileContents = await prettier.format(newFileContentsNotFormated,{ semi: false, parser: "typescript" })
  const newFileContents = `import { JzodObject, jzodObject } from "@miroir-framework/jzod-ts";
${newFileContentsNotFormated}
`;

  if (targetFileName && fs.existsSync(targetFileName)) {
    const oldFileContents = fs.readFileSync(targetFileName).toString()
    if (newFileContents != oldFileContents)  {
      console.log("generateZodSchemaFileFromJzodSchema newFileContents",newFileContents);
      fs.writeFileSync(targetFileName,newFileContents);
    } else {
      console.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport old contents equal new contents, no file generation needed.");
    }
  } else {
    fs.writeFileSync(targetFileName,newFileContents);

    // throw new Error("generateZodSchemaFileFromJzodSchema could not find file " + generatedZodSchemasFile);
    
  }
}

const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-filesystem.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-indexedDb.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-mixed_filesystem-sql.json', import.meta.url)).toString());
// const configFileContents = JSON.parse(readFileSync(new URL('../config/miroirConfig.server-sql.json', import.meta.url)).toString());
console.log('configFileContents',configFileContents)

// const applicationDeploymentLibrary = JSON.parse(readFileSync(new URL('./assets/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json', import.meta.url)).toString());
// console.log('applicationDeploymentLibrary',applicationDeploymentLibrary)

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
  await localMiroirStoreController?.open();
  await localMiroirStoreController.bootFromPersistedState(defaultMiroirMetaModel.entities, defaultMiroirMetaModel.entityDefinitions);
} catch(e) {
  console.error("failed to initialize meta-model, Entity 'Entity' is likely missing from Database, or database could not be opened. Entity Entity can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",localMiroirStoreController.getEntityUuids(),'error',e);
}

try {
  await localAppStoreController?.open();
  await localAppStoreController.bootFromPersistedState(defaultMiroirMetaModel.entities, defaultMiroirMetaModel.entityDefinitions);
} catch(e) {
  console.error("failed to initialize app, Entity 'Entity' is likely missing from Database, or database could not be opened. Entity Entity can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",localMiroirStoreController.getEntityUuids(),'error',e);
}

// ################################################################################################
const jzodSchemaConversion: {
  jzodObject: JzodObject,
  targetFileName: string,
  jzodSchemaVariableName:string,
}[] = [
  {
    jzodObject: entityDefinitionReport.jzodSchema as any as JzodObject,
    targetFileName: "C://Users/nono/Documents/devhome/miroir-app/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/server-generated.ts",
    jzodSchemaVariableName: "report",
  },
  // {
  //   jzodObject: miroirJzodSchemaBootstrap.definition as any as JzodObject,
  //   targetFileName: "C://Users/nono/Documents/devhome/miroir-app/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/jzodSchema.ts",
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
