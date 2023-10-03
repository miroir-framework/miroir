// import * as fs from "fs";
// // import * as prettier from "prettier";

// import {
//   JzodObject, jzodToTsCode,
// } from "@miroir-framework/jzod-ts";




// import { miroirJzodSchemaBootstrap, miroirJzodSchemaBootstrapZodSchema } from "miroir-core/src/0_interfaces/1_core/EntityDefinition";

// const entityDefinitionEntityDefinitionLocal:{
//   jzodSchema: JzodObject,
//   [k:string]:any
// } = entityDefinitionEntityDefinition as {
//   jzodSchema: JzodObject,
//   [k:string]:any
// };

// export async function generateZodSchemaFileFromJzodSchema(
//   jzodObject: JzodObject,
//   targetFileName: string,
//   jzodSchemaVariableName:string,
// ) {
//   // console.log("generateZodSchemaFileFromJzodSchema called!");
  
//   // console.log("generateZodSchemaFileFromJzodSchema miroirJzodSchemaBootstrap",JSON.stringify(miroirJzodSchemaBootstrap,null,2));
//   // console.log("generateZodSchemaFileFromJzodSchema miroirJzodSchemaBootstrapZodSchema",JSON.stringify(miroirJzodSchemaBootstrapZodSchema,null,2));

// //   const globalReferences = ()=>({
// //     "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": jzodElementSchemaToZodSchemaAndDescription (

// //       miroirJzodSchemaBootstrap.definition as JzodObject,
// //       () => miroirJzodSchemaBootstrapZodSchema,
// //     )
// //   });
// // // console.log("generateZodSchemaFileFromJzodSchema miroir entity definition TS type generation","globalReferences",globalReferences);

// //   const jzodObjectZodSchema: ZodSchemaAndDescription = jzodElementSchemaToZodSchemaAndDescription (
// //     // entityDefinitionReport.jzodSchema as any as JzodObject,
// //     jzodObject,
// //     miroirJzodSchemaBootstrapZodSchema,
// //     globalReferences
// //   );

//   // console.log(
//   //   "generateZodSchemaFileFromJzodSchema miroir entity definition TS type generation",
//   //   "globalReferences 1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
//   //   (globalReferences["1e8dab4b-65a3-4686-922e-ce89a2d62aa9"].zodSchema as AnyZodObject).shape
//   // );
//   // console.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport",entityDefinitionReport);
 
//   // const generatedZodSchemasFile = "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/server-generated.ts";
//   // const generatedZodSchemasFile = "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-standalone-app/src/preprocessor-generated/server-generated.ts";
 
//   const newFileContentsNotFormated = jzodToTsCode(jzodObject, true, jzodSchemaVariableName)
//   // const newFileContents = await prettier.format(newFileContentsNotFormated,{ semi: false, parser: "typescript" })
//   const newFileContents = newFileContentsNotFormated;

//   if (targetFileName && fs.existsSync(targetFileName)) {
//     const oldFileContents = fs.readFileSync(targetFileName).toString()
//     if (newFileContents != oldFileContents)  {
//       console.log("generateZodSchemaFileFromJzodSchema newFileContents",newFileContents);
//       fs.writeFileSync(targetFileName,newFileContents);
//     } else {
//       console.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport old contents equal new contents, no file generation needed.");
//     }
//   } else {
//     fs.writeFileSync(targetFileName,newFileContents);

//     // throw new Error("generateZodSchemaFileFromJzodSchema could not find file " + generatedZodSchemasFile);
    
//   }
// }