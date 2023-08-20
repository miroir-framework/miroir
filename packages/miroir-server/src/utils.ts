import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";

import { JzodObject, ZodSchemaAndDescription, getJsCodeCorrespondingToZodSchemaAndDescription, jzodSchemaObjectToZodSchemaAndDescription } from "@miroir-framework/jzod";
// import { miroirJzodSchemaBootstrap, miroirJzodSchemaBootstrapZodSchema } from "miroir-core/src/0_interfaces/1_core/EntityDefinition";
import { AnyZodObject, ZodTypeAny } from "zod";
import { entityDefinitionEntityDefinition, entityDefinitionReport, miroirJzodSchemaBootstrap, miroirJzodSchemaBootstrapZodSchema } from "miroir-core";

const entityDefinitionEntityDefinitionLocal:{
  jzodSchema: JzodObject,
  [k:string]:any
} = entityDefinitionEntityDefinition as {
jzodSchema: JzodObject,
[k:string]:any
};

export async function generateZodSchemaFileFromJzodSchema(
) {
  // console.log("generateZodSchemaFileFromJzodSchema called!");
  
  // console.log("generateZodSchemaFileFromJzodSchema miroirJzodSchemaBootstrap",JSON.stringify(miroirJzodSchemaBootstrap,null,2));
  // console.log("generateZodSchemaFileFromJzodSchema miroirJzodSchemaBootstrapZodSchema",JSON.stringify(miroirJzodSchemaBootstrapZodSchema,null,2));

  const globalReferences = {
    "1e8dab4b-65a3-4686-922e-ce89a2d62aa9":jzodSchemaObjectToZodSchemaAndDescription (
      miroirJzodSchemaBootstrap.definition as JzodObject, // TODO: replace with actual definition (from json file)
      miroirJzodSchemaBootstrapZodSchema,
    )
  }
  // console.log("generateZodSchemaFileFromJzodSchema miroir entity definition TS type generation","globalReferences",globalReferences);
  
  const entityDefinitionEntityDefinitionZodSchema: ZodSchemaAndDescription<ZodTypeAny> = jzodSchemaObjectToZodSchemaAndDescription (
    entityDefinitionReport.jzodSchema as JzodObject,
    miroirJzodSchemaBootstrapZodSchema,
    globalReferences
  );

  // console.log(
  //   "generateZodSchemaFileFromJzodSchema miroir entity definition TS type generation",
  //   "globalReferences 1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
  //   (globalReferences["1e8dab4b-65a3-4686-922e-ce89a2d62aa9"].zodSchema as AnyZodObject).shape
  // );
  // console.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport",entityDefinitionReport);

  const generatedZodSchemasFile = "C://Users/nono/Documents/devhome/miroir-app/packages/miroir-standalone-app/src/preprocessor-generated/server-generated.ts";

  const newFileContentsNotFormated = getJsCodeCorrespondingToZodSchemaAndDescription('entityDefinitionReport',entityDefinitionEntityDefinitionZodSchema)
  const newFileContents = await prettier.format(newFileContentsNotFormated,{ semi: false, parser: "typescript" })

  if (generatedZodSchemasFile && fs.existsSync(generatedZodSchemasFile)) {
    const oldFileContents = fs.readFileSync(generatedZodSchemasFile).toString()
    if (newFileContents != oldFileContents)  {
      console.log("generateZodSchemaFileFromJzodSchema newFileContents",newFileContents);
      fs.writeFileSync(generatedZodSchemasFile,newFileContents);
    } else {
      console.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport old contents equal new contents, no file generation needed.");
    }
  } else {
    fs.writeFileSync(generatedZodSchemasFile,newFileContents);

    // throw new Error("generateZodSchemaFileFromJzodSchema could not find file " + generatedZodSchemasFile);
    
  }
}