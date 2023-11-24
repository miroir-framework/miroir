import { jzodToTsCode } from "@miroir-framework/jzod-ts";
// require JzodElement, jzodToTsCode from "@miroir-framework/jzod-ts";
// import * as fs from "fs";
import { existsSync, readFileSync, writeFileSync } from 'fs';

// import { getLoggerName, LoggerInterface, MiroirLoggerFactory } from "miroir-core";

// import miroirFundamentalJzodSchema from "./0_interfaces/1_core/bootstrapJzodSchemas/fe9b7d99-f216-44de-bb6e-60e1a1ebb739.json"  assert { type: "json" };

const miroirFundamentalJzodSchema = JSON.parse(readFileSync(new URL('./0_interfaces/1_core/bootstrapJzodSchemas/fe9b7d99-f216-44de-bb6e-60e1a1ebb739.json', import.meta.url)).toString());


export async function generateZodSchemaFileFromJzodSchema(
  jzodElement,
  targetFileName,
  jzodSchemaVariableName,
  // jzodElement: JzodElement,
  // targetFileName: string,
  // jzodSchemaVariableName:string,
) {
  // log.log("generateZodSchemaFileFromJzodSchema called!");
 
  const newFileContentsNotFormated = jzodToTsCode(jzodElement, true, jzodSchemaVariableName)
  const newFileContents = `import { JzodObject, jzodObject } from "@miroir-framework/jzod-ts";
${newFileContentsNotFormated}
`;

  if (targetFileName && existsSync(targetFileName)) {
    const oldFileContents = readFileSync(targetFileName).toString()
    if (newFileContents != oldFileContents)  {
      console.log("generateZodSchemaFileFromJzodSchema newFileContents",newFileContents);
      writeFileSync(targetFileName,newFileContents);
    } else {
      console.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport old contents equal new contents, no file generation needed.");
    }
  } else {
    fs.writeFileSync(targetFileName,newFileContents);
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
    // jzodElement: miroirFundamentalJzodSchema.definition as any as JzodElement,
    jzodElement: miroirFundamentalJzodSchema.definition,
    // targetFileName: "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
    targetFileName: "./src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
    jzodSchemaVariableName: "miroirFundamentalType",
  },
  // {
  //   jzodObject: miroirJzodSchemaBootstrap.definition as any as JzodObject,
  //   targetFileName: "C://Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/jzodSchema.ts",
  //   jzodSchemaVariableName: "jzodSchema",
  // }
];

try {
  for (const schema of jzodSchemaConversion) {
    await generateZodSchemaFileFromJzodSchema(schema.jzodElement,schema.targetFileName,schema.jzodSchemaVariableName)
    console.info("GENERATED",schema.targetFileName);
  }
  
} catch (error) {
  console.error("could not generate TS files from Jzod schemas", error);
  
}