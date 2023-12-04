import { jzodToTsCode } from "@miroir-framework/jzod-ts";
// require JzodElement, jzodToTsCode from "@miroir-framework/jzod-ts";
// import * as fs from "fs";
import { existsSync, readFileSync, writeFileSync } from 'fs';
// import ModelEntityUpdateCreateMetaModelInstanceSchema from "../dist/src/0_interfaces/2_domain/ModelUpdateInterface.js";
import {ModelEntityUpdateCreateMetaModelInstanceSchema} from "../dist/bundle.js";
import { zodToJzod } from "@miroir-framework/jzod";
// import { ModelEntityUpdateCreateMetaModelInstanceSchema } from "../dist//0_interfaces/2_domain/ModelUpdateInterface.ts";

// import { getLoggerName, LoggerInterface, MiroirLoggerFactory } from "miroir-core";

// import miroirFundamentalJzodSchema from "./0_interfaces/1_core/bootstrapJzodSchemas/fe9b7d99-f216-44de-bb6e-60e1a1ebb739.json"  assert { type: "json" };

const miroirFundamentalJzodSchema = JSON.parse(readFileSync(new URL('./0_interfaces/1_core/bootstrapJzodSchemas/fe9b7d99-f216-44de-bb6e-60e1a1ebb739.json', import.meta.url)).toString());
// const test = JSON.parse(readFileSync(new URL('./0_interfaces/1_core/bootstrapJzodSchemas/4721c050-71a0-4f9d-beb4-6520817594e0.json', import.meta.url)).toString());


export async function generateZodSchemaFileFromJzodSchema(
  jzodElement,
  targetFileName,
  jzodSchemaVariableName,
  // jzodElement: JzodElement,
  // targetFileName: string,
  // jzodSchemaVariableName:string,
) {
  // log.log("generateZodSchemaFileFromJzodSchema called!");
 
  const generateTypeAnotationsForSchema =
    // jzodElement.type == "schemaReference" ? Object.keys(jzodElement.context) : [];
    jzodElement.type == "schemaReference"
      ? Object.keys(jzodElement.context).filter((e) => !["jzodObject", "entityInstance"].includes(e))
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
// : {
//   // jzodElement: JzodElement,
//   // targetFileName: string,
//   // jzodSchemaVariableName:string,
// }[]
= [
  // {
  //   jzodObject: entityDefinitionReport.jzodSchema as any as JzodObject,
  //   targetFileName: "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/server-generated.ts",
  //   jzodSchemaVariableName: "report",
  // },
  {
    jzodElement: miroirFundamentalJzodSchema.definition,
    targetFileName: "./src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
    jzodSchemaVariableName: "miroirFundamentalType",
  },
  // {
  //   jzodElement: test.definition,
  //   targetFileName: "./src/0_interfaces/1_core/preprocessor-generated/test.ts",
  //   jzodSchemaVariableName: "test",
  // },
  // {
  //   jzodObject: miroirJzodSchemaBootstrap.definition as any as JzodObject,
  //   targetFileName: "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/jzodSchema.ts",
  //   jzodSchemaVariableName: "jzodSchema",
  // }
];


// console.log("####### JZodElement to convert",JSON.stringify(ModelEntityUpdateCreateMetaModelInstanceSchema, null, 2));
// const convertedZodSchema = zodToJzod(ModelEntityUpdateCreateMetaModelInstanceSchema,"ModelEntityUpdateCreateMetaModelInstanceSchema");
// console.log("####### convertedZodSchema",JSON.stringify(convertedZodSchema, null, 2));

try {
  for (const schema of jzodSchemaConversion) {
    await generateZodSchemaFileFromJzodSchema(schema.jzodElement,schema.targetFileName,schema.jzodSchemaVariableName)
    console.info("GENERATED",schema.targetFileName);
  }
  
} catch (error) {
  console.error("could not generate TS files from Jzod schemas", error);
  
}