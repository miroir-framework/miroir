import path from "path";
import fs from 'fs/promises';
import {
  JzodElement,
  // jzodToZodTextAndZodSchemaForTsGeneration,
  jzodToTsCode,
} from "@miroir-framework/jzod-ts";
import { sqlQuerySelectSchema } from "../src/1_core/SqlQueryBuilder";

// ################################################################################################
async function fileExists(filePath: string): Promise<boolean> {
  try {
      await fs.access(filePath);
      return true;
  } catch {
      return false;
  }
}

// ################################################################################################
async function writeFile(
  jzodElement: any,
  targetFileName: any,
  jzodSchemaVariableName: any,
  newFileContents: any
) {
  if (targetFileName && (await fileExists(targetFileName))) {
    const oldFileContents = await fs.readFile(targetFileName).toString();
    if (newFileContents != oldFileContents) {
      await fs.writeFile(targetFileName, newFileContents);
      console.log("writeFile", targetFileName, "generated!");
    } else {
      console.log(
        "writeFile entityDefinitionReport old contents equal new contents, no file generation needed."
      );
    }
  } else {
    await fs.writeFile(targetFileName, newFileContents);
  }
}

// ################################################################################################
const extendedJzodSchemasTsTypes = jzodToTsCode(
  "sqlQuerySelectSchema",
  sqlQuerySelectSchema,
  {},
  true, // exportPrefix
  false, // headerForZodImports
  Object.keys(sqlQuerySelectSchema.context?? {}),
);
console.log("extendedJzodSchemasTsTypes",extendedJzodSchemasTsTypes);

const fileContents = `import { ZodType, ZodTypeAny, z } from "zod";
${extendedJzodSchemasTsTypes}
`

const targetFileName = path.join("./src","generated.ts")
console.log("generateTsTypeFileFromJzodSchemaInParallel writing file:", targetFileName, fileContents.length);
writeFile(undefined, targetFileName, undefined, fileContents);
console.log("generateTsTypeFileFromJzodSchemaInParallel file written OK:", targetFileName);
