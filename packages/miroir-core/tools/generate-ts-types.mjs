import { jzodToTsCode } from "@miroir-framework/jzod-ts";
// require JzodElement, jzodToTsCode from "@miroir-framework/jzod-ts";
// import * as fs from "fs";
import { existsSync, readFileSync, writeFileSync } from 'fs';
// import ModelEntityUpdateCreateMetaModelInstanceSchema from "../dist/src/0_interfaces/2_domain/ModelUpdateInterface.js";
import * as f from "../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema.js";
// import { miroirFundamentalJzodSchema } from "../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema.js";
import path from "path";
// import { ModelEntityUpdateCreateMetaModelInstanceSchema } from "../dist//0_interfaces/2_domain/ModelUpdateInterface.ts";

// import { getLoggerName, LoggerInterface, MiroirLoggerFactory } from "miroir-core";

// import miroirFundamentalJzodSchema from "./0_interfaces/1_core/bootstrapJzodSchemas/fe9b7d99-f216-44de-bb6e-60e1a1ebb739.json"  assert { type: "json" };

// const localMiroirFundamentalJzodSchema = JSON.parse(miroirFundamentalJzodSchema).toString();
// const miroirFundamentalJzodSchema = JSON.parse(readFileSync(new URL('./0_interfaces/1_core/bootstrapJzodSchemas/fe9b7d99-f216-44de-bb6e-60e1a1ebb739.json', import.meta.url)).toString());
// const test = JSON.parse(readFileSync(new URL('./0_interfaces/1_core/bootstrapJzodSchemas/4721c050-71a0-4f9d-beb4-6520817594e0.json', import.meta.url)).toString());


export async function generateZodSchemaFileFromJzodSchema(
  jzodElement,
  targetFileName,
  jzodSchemaVariableName,
  // jzodElement: JzodElement,
  // targetFileName: string,
  // jzodSchemaVariableName:string,
) {
  // log.info("generateZodSchemaFileFromJzodSchema called!");
 
  const generateTypeAnotationsForSchema =
    // jzodElement.type == "schemaReference" ? Object.keys(jzodElement.context) : [];
    jzodElement.type == "schemaReference"
      ? Object.keys(jzodElement.context).filter(
          (e) =>
            ![
              "jzodObject",
              "entityInstance",
              "entityAttributeUntypedCore",
              "entityAttributeCore",
              "entityArrayAttribute",
              "entityForeignKeyAttribute",
            ].includes(e)
        )
      : [];

  console.log("generateZodSchemaFileFromJzodSchema generateTypeAnotationsForSchema:", generateTypeAnotationsForSchema);
  const newFileContentsNotFormated = jzodToTsCode(
    jzodElement,
    true,
    jzodSchemaVariableName,
    generateTypeAnotationsForSchema,
  );
  // const newFileContents = `import { JzodObject, jzodObject } from "@miroir-framework/jzod-ts";
  const newFileContents = newFileContentsNotFormated;

  console.log("generateZodSchemaFileFromJzodSchema targetFileName:", targetFileName);
  if (targetFileName && existsSync(targetFileName)) {
    const oldFileContents = readFileSync(targetFileName).toString()
    if (newFileContents != oldFileContents)  {
      console.log("generateZodSchemaFileFromJzodSchema newFileContents",newFileContents);
      writeFileSync(targetFileName,newFileContents);
    } else {
      console.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport old contents equal new contents, no file generation needed.");
    }
  } else {
    writeFileSync(targetFileName,newFileContents);
  }
}

// ################################################################################################
const jzodSchemaConversion
= [
  {
    jzodElement: f.miroirFundamentalJzodSchema.definition,
    targetDirectory: "./src/0_interfaces/1_core/preprocessor-generated",
    targetFileName: "./src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
    jzodSchemaVariableName: "miroirFundamentalType",
  },
];


// console.log("####### JZodElement to convert",JSON.stringify(ModelEntityUpdateCreateMetaModelInstanceSchema, null, 2));
// const convertedZodSchema = zodToJzod(ModelEntityUpdateCreateMetaModelInstanceSchema,"ModelEntityUpdateCreateMetaModelInstanceSchema");
// console.log("####### convertedZodSchema",JSON.stringify(convertedZodSchema, null, 2));

try {
  const miroirFundamentalJzodSchemaFilePath = path.join(jzodSchemaConversion[0].targetDirectory,"miroirFundamentalJzodSchema.ts")
  const miroirFundamentalJzodSchemaJson = "export const miroirFundamentalJzodSchema = " + JSON.stringify(f.miroirFundamentalJzodSchema, undefined, 2);
  console.log("generateZodSchemaFileFromJzodSchema miroirFundamentalJzodSchemaFilePath",miroirFundamentalJzodSchemaFilePath);
  if (miroirFundamentalJzodSchemaFilePath && existsSync(miroirFundamentalJzodSchemaFilePath)) {
    const oldFileContents = readFileSync(miroirFundamentalJzodSchemaFilePath).toString()
    if (miroirFundamentalJzodSchemaJson != oldFileContents)  { // TODO: do deep equal
      console.log("generateZodSchemaFileFromJzodSchema miroirFundamentalJzodSchemaFileName miroirFundamentalJzodSchemaJson",miroirFundamentalJzodSchemaJson);
      writeFileSync(miroirFundamentalJzodSchemaFilePath,miroirFundamentalJzodSchemaJson);
    } else {
      console.log("generateZodSchemaFileFromJzodSchema miroirFundamentalJzodSchemaFileName old contents equal new contents, no file generation needed.");
    }
  } else {
    writeFileSync(miroirFundamentalJzodSchemaFilePath,miroirFundamentalJzodSchemaJson);
  }

  for (const schema of jzodSchemaConversion) {
    await generateZodSchemaFileFromJzodSchema(schema.jzodElement,schema.targetFileName,schema.jzodSchemaVariableName)
    console.info("GENERATED",schema.targetFileName);
  }


} catch (error) {
  console.error("could not generate TS files from Jzod schemas", error);
  
}